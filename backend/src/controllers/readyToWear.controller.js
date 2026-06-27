import prisma from "../config/prisma.js";
import AppError from "../utils/AppError.js";
import { successResponse } from "../utils/apiResponse.js";
import { uploadMultipleImages } from "../services/cloudinary.service.js";
import { getStockStatus } from "../utils/stockStatus.js";

// ─── GET /ready-to-wear ────────────────────────────────────────────────────
export const getReadyToWearItems = async (req, res) => {
  const { category, size, featured, inStock, page, limit, search } = req.query;

  const where = { isActive: true };

  if (category) {
    where.category = { contains: category, mode: "insensitive" };
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (size) {
    // Prisma's array contains filter — checks if the size exists in availableSizes
    where.availableSizes = { has: size };
  }

  if (featured === "true") where.isFeatured = true;

  if (inStock === "true") {
    where.stockStatus = { in: ["IN_STOCK", "LOW_STOCK"] };
  }

  const parsedPage = Math.max(parseInt(page) || 1, 1);
  const parsedLimit = Math.max(parseInt(limit) || 12, 1);
  const skip = (parsedPage - 1) * parsedLimit;

  const [totalCount, items] = await prisma.$transaction([
    prisma.readyToWear.count({ where }),
    prisma.readyToWear.findMany({
      where,
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }, { id: "asc" }],
      skip,
      take: parsedLimit,
    }),
  ]);

  return successResponse(res, 200, "Items retrieved", {
    count: items.length,
    items,
    pagination: {
      currentPage: parsedPage,
      totalPages: Math.ceil(totalCount / parsedLimit),
      totalItems: totalCount,
    },
  });
};

// ─── GET /ready-to-wear/admin ────────────────────────────────────────────────────
export const getReadyToWearItemsAdmin = async (req, res) => {
  const { category, size, featured, stockStatus, page, limit, search, isActive } = req.query;

  const where = {};

  if (isActive === "true") where.isActive = true;
  if (isActive === "false") where.isActive = false;

  if (category) {
    where.category = { contains: category, mode: "insensitive" };
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (size) {
    // Prisma's array contains filter — checks if the size exists in availableSizes
    where.availableSizes = { has: size };
  }

  if (featured === "true") where.isFeatured = true;

  if (stockStatus) {
    where.stockStatus = stockStatus;
  }

  const parsedPage = Math.max(parseInt(page) || 1, 1);
  const parsedLimit = Math.max(parseInt(limit) || 12, 1);
  const skip = (parsedPage - 1) * parsedLimit;

  const [totalCount, items] = await prisma.$transaction([
    prisma.readyToWear.count({ where }),
    prisma.readyToWear.findMany({
      where,
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }, { id: "asc" }],
      skip,
      take: parsedLimit,
    }),
  ]);

  return successResponse(res, 200, "Items retrieved", {
    count: items.length,
    items,
    pagination: {
      currentPage: parsedPage,
      totalPages: Math.ceil(totalCount / parsedLimit),
      totalItems: totalCount,
    },
  });
};

// ─── GET /ready-to-wear/categories ─────────────────────────────────────────
export const getReadyToWearCategories = async (req, res) => {
  const items = await prisma.readyToWear.findMany({
    where: { isActive: true },
    select: { category: true },
    distinct: ["category"],
  });

  const categories = items.map((i) => i.category).filter(Boolean);

  return successResponse(res, 200, "Ready-to-wear categories retrieved", {
    categories,
  });
};

// ─── GET /ready-to-wear/:id ────────────────────────────────────────────────
export const getReadyToWearItem = async (req, res) => {
  const item = await prisma.readyToWear.findUnique({
    where: { id: req.params.id },
  });

  if (!item || !item.isActive) {
    throw new AppError("Item not found", 404);
  }

  return successResponse(res, 200, "Item retrieved", { item });
};

// ─── POST /ready-to-wear ───────────────────────────────────────────────────
export const createReadyToWearItem = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new AppError("At least one image is required", 400);
  }

  const uploadResults = await uploadMultipleImages(req.files, "ready-to-wear");
  const imageUrls = uploadResults.map((r) => r.secure_url);

  const {
    name,
    description,
    price,
    category,
    availableSizes,
    fabricDetails,
    careInstructions,
    stockCount,
    isFeatured,
  } = req.validatedBody;

  // Determine initial stock status from stock count
  const stockStatus = getStockStatus(stockCount ?? 0);

  const item = await prisma.readyToWear.create({
    data: {
      name,
      description,
      price,
      category,
      images: imageUrls,
      availableSizes,
      fabricDetails: fabricDetails || null,
      careInstructions: careInstructions || null,
      stockCount: stockCount ?? 0,
      stockStatus,
      isFeatured: isFeatured ?? false,
    },
  });

  return successResponse(res, 201, "Item created successfully", { item });
};

// ─── PUT /ready-to-wear/:id ────────────────────────────────────────────────
export const updateReadyToWearItem = async (req, res) => {
  const existing = await prisma.readyToWear.findUnique({
    where: { id: req.params.id },
  });

  if (!existing) throw new AppError("Item not found", 404);

  const updateData = { ...req.validatedBody };

  // Auto-recalculate stockStatus when stockCount changes
  if (updateData.stockCount !== undefined) {
    updateData.stockStatus = getStockStatus(updateData.stockCount);
  }

  // Allow admin to manually override stockStatus regardless of count
  // (e.g. mark OUT_OF_STOCK even if count > 0 for items being held)
  if (req.validatedBody.stockStatus) {
    updateData.stockStatus = req.validatedBody.stockStatus;
  }

  if (req.files && req.files.length > 0) {
    const uploadResults = await uploadMultipleImages(
      req.files,
      "ready-to-wear",
    );
    const newUrls = uploadResults.map((r) => r.secure_url);
    updateData.images = [...existing.images, ...newUrls];
  }

  const updated = await prisma.readyToWear.update({
    where: { id: req.params.id },
    data: updateData,
  });

  return successResponse(res, 200, "Item updated successfully", {
    item: updated,
  });
};

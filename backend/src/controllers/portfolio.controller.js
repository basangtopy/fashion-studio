import prisma from "../config/prisma.js";
import AppError from "../utils/AppError.js";
import { successResponse } from "../utils/apiResponse.js";
import { uploadMultipleImages } from "../services/cloudinary.service.js";

// ─── GET /portfolio ────────────────────────────────────────────────────────
// Public — only published entries
export const getPortfolioEntries = async (req, res) => {
  const { category, featured, page, limit, search } = req.query;

  const where = { isPublished: true, clientConsent: true };

  if (category) {
    where.category = { contains: category, mode: "insensitive" };
  }

  if (featured === "true") where.isFeatured = true;

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const parsedPage = Math.max(parseInt(page) || 1, 1);
  const parsedLimit = Math.max(parseInt(limit) || 12, 1);
  const skip = (parsedPage - 1) * parsedLimit;

  const [totalCount, entries] = await prisma.$transaction([
    prisma.portfolio.count({ where }),
    prisma.portfolio.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        images: true,
        isFeatured: true,
        createdAt: true,
        // Intentionally NOT including orderId or client details
        // Portfolio entries are anonymous — we don't expose which client it belongs to
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }, { id: "asc" }],
      skip,
      take: parsedLimit,
    }),
  ]);

  return successResponse(res, 200, "Portfolio retrieved", {
    count: entries.length,
    entries,
    pagination: {
      currentPage: parsedPage,
      totalPages: Math.ceil(totalCount / parsedLimit),
      totalItems: totalCount,
    },
  });
};

// ─── GET /portfolio/categories ─────────────────────────────────────────────
export const getPortfolioCategories = async (req, res) => {
  const entries = await prisma.portfolio.findMany({
    where: { isPublished: true, clientConsent: true },
    select: { category: true },
    distinct: ["category"],
  });

  const categories = entries.map((e) => e.category).filter(Boolean);

  return successResponse(res, 200, "Portfolio categories retrieved", {
    categories,
  });
};

// ─── GET /portfolio/:id ────────────────────────────────────────────────────
export const getPortfolioEntry = async (req, res) => {
  const entry = await prisma.portfolio.findUnique({
    where: { id: req.params.id },
  });

  if (!entry || !entry.isPublished || !entry.clientConsent) {
    throw new AppError("Portfolio entry not found", 404);
  }

  // Only return public-safe fields
  const { orderId, clientConsent, isPublished, updatedAt, ...publicEntry } = entry;

  return successResponse(res, 200, "Portfolio entry retrieved", { entry: publicEntry });
};

// ─── POST /portfolio ───────────────────────────────────────────────────────
export const createPortfolioEntry = async (req, res) => {
  const {
    orderId,
    title,
    description,
    category,
    clientConsent,
    isPublished,
    isFeatured,
  } = req.validatedBody;

  // If linked to an order, verify the order exists and is completed
  if (orderId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true },
    });

    if (!order) throw new AppError("Order not found", 404);

    if (order.status !== "COMPLETED") {
      throw new AppError(
        "Portfolio entries can only be created from completed orders",
        400,
      );
    }

    // Check for duplicate portfolio entry for this order
    const existing = await prisma.portfolio.findUnique({ where: { orderId } });
    if (existing) {
      throw new AppError("A portfolio entry already exists for this order", 409);
    }
  }

  // Images are optional at creation — can be added/updated later
  let imageUrls = [];
  if (req.files && req.files.length > 0) {
    const uploadResults = await uploadMultipleImages(req.files, "portfolio");
    imageUrls = uploadResults.map((r) => r.secure_url);
  }

  const entry = await prisma.portfolio.create({
    data: {
      orderId: orderId || null,
      title: title || null,
      description: description || null,
      category,
      images: imageUrls,
      clientConsent: clientConsent ?? false,
      isPublished: isPublished ?? false,
      isFeatured: isFeatured ?? false,
    },
  });

  return successResponse(res, 201, "Portfolio entry created successfully", {
    entry,
  });
};

// ─── GET /portfolio/admin ────────────────────────────────────────────────────────
// Admin — all entries
export const getPortfolioEntriesAdmin = async (req, res) => {
  const { category, featured, status, page, limit, search } = req.query;

  const where = {};

  if (category) {
    where.category = { contains: category, mode: "insensitive" };
  }

  if (featured === "true") where.isFeatured = true;

  if (status === "published") where.isPublished = true;

  if (status === "drafts") where.isPublished = false;

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const parsedPage = Math.max(parseInt(page) || 1, 1);
  const parsedLimit = Math.max(parseInt(limit) || 12, 1);
  const skip = (parsedPage - 1) * parsedLimit;

  const [totalCount, entries] = await prisma.$transaction([
    prisma.portfolio.count({ where }),
    prisma.portfolio.findMany({
      where,
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }, { id: "asc" }],
      skip,
      take: parsedLimit,
    }),
  ]);

  return successResponse(res, 200, "Portfolio retrieved", {
    count: entries.length,
    entries,
    pagination: {
      currentPage: parsedPage,
      totalPages: Math.ceil(totalCount / parsedLimit),
      totalItems: totalCount,
    },
  });
};

// ─── PUT /portfolio/:id ────────────────────────────────────────────────────
export const updatePortfolioEntry = async (req, res) => {
  const existing = await prisma.portfolio.findUnique({
    where: { id: req.params.id },
  });

  if (!existing) throw new AppError("Portfolio entry not found", 404);

  const updateData = { ...req.validatedBody };

  if (req.files && req.files.length > 0) {
    const uploadResults = await uploadMultipleImages(req.files, "portfolio");
    const newUrls = uploadResults.map((r) => r.secure_url);
    updateData.images = [...existing.images, ...newUrls];
  }

  const updated = await prisma.portfolio.update({
    where: { id: req.params.id },
    data: updateData,
  });

  return successResponse(res, 200, "Portfolio entry updated successfully", {
    entry: updated,
  });
};

// Search support added
import prisma from "../config/prisma.js";
import AppError from "../utils/AppError.js";
import { successResponse } from "../utils/apiResponse.js";
import {
  uploadMultipleImages,
  deleteImages,
} from "../services/cloudinary.service.js";

// ─── GET /styles ───────────────────────────────────────────────────────────
// Public — filterable by category and model
export const getStyles = async (req, res) => {
  const { category, model, featured, page, limit, search } = req.query;

  const where = { isActive: true };

  if (category) where.category = { contains: category, mode: "insensitive" };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }
  // 'insensitive' makes the search case-insensitive
  // so searching "gowns" matches "Gowns" in the database

  if (model === "1") where.availableForModel1 = true;
  if (model === "2") where.availableForModel2 = true;
  if (featured === "true") where.isFeatured = true;

  // Pagination logic
  const parsedPage = Math.max(parseInt(page) || 1, 1);
  const parsedLimit = Math.max(parseInt(limit) || 12, 1);
  const skip = (parsedPage - 1) * parsedLimit;

  const [totalCount, styles] = await prisma.$transaction([
    prisma.style.count({ where }),
    prisma.style.findMany({
      where,
      orderBy: [
        { isFeatured: "desc" },
        { createdAt: "desc" },
      ],
      skip,
      take: parsedLimit,
    }),
  ]);

  return successResponse(res, 200, "Styles retrieved", {
    count: styles.length,
    styles,
    pagination: {
      currentPage: parsedPage,
      totalPages: Math.ceil(totalCount / parsedLimit),
      totalItems: totalCount,
    },
  });
};

// ─── GET /styles/categories ────────────────────────────────────────────────
export const getStyleCategories = async (req, res) => {
  const styles = await prisma.style.findMany({
    where: { isActive: true },
    select: { category: true },
    distinct: ["category"],
  });

  const categories = styles.map((s) => s.category).filter(Boolean);

  return successResponse(res, 200, "Style categories retrieved", {
    categories,
  });
};

// ─── GET /styles/:id ───────────────────────────────────────────────────────
export const getStyle = async (req, res) => {
  const style = await prisma.style.findUnique({
    where: { id: req.params.id },
  });

  if (!style || !style.isActive) {
    throw new AppError("Style not found", 404);
  }

  return successResponse(res, 200, "Style retrieved", { style });
};

// ─── POST /styles ──────────────────────────────────────────────────────────
export const createStyle = async (req, res) => {
  // req.files is set by multer when using upload.array()
  if (!req.files || req.files.length === 0) {
    throw new AppError("At least one image is required", 400);
  }

  // Upload all images to Cloudinary in parallel
  const uploadResults = await uploadMultipleImages(req.files, "styles");
  const imageUrls = uploadResults.map((result) => result.secure_url);

  const {
    name,
    description,
    category,
    availableForModel1,
    availableForModel2,
    isFeatured,
  } = req.validatedBody;

  const style = await prisma.style.create({
    data: {
      name,
      description,
      category,
      images: imageUrls,
      availableForModel1: availableForModel1 ?? true,
      availableForModel2: availableForModel2 ?? true,
      isFeatured: isFeatured ?? false,
    },
  });

  return successResponse(res, 201, "Style created successfully", { style });
};

// ─── PUT /styles/:id ───────────────────────────────────────────────────────
export const updateStyle = async (req, res) => {
  const existing = await prisma.style.findUnique({
    where: { id: req.params.id },
  });

  if (!existing) throw new AppError("Style not found", 404);

  const updateData = { ...req.validatedBody };

  // If new images were uploaded, add them to the existing images array
  // We append rather than replace so the admin can add more photos without
  // losing the existing ones. To replace images entirely, use a separate
  // dedicated endpoint if needed later.
  if (req.files && req.files.length > 0) {
    const uploadResults = await uploadMultipleImages(req.files, "styles");
    const newUrls = uploadResults.map((r) => r.secure_url);
    updateData.images = [...existing.images, ...newUrls];
  }

  const updated = await prisma.style.update({
    where: { id: req.params.id },
    data: updateData,
  });

  return successResponse(res, 200, "Style updated successfully", {
    style: updated,
  });
};

// ─── DELETE /styles/:id ────────────────────────────────────────────────────
// Soft delete — sets isActive to false
// Hard delete is intentionally not provided — styles may be referenced by orders
export const deleteStyle = async (req, res) => {
  const existing = await prisma.style.findUnique({
    where: { id: req.params.id },
  });

  if (!existing) throw new AppError("Style not found", 404);
  if (!existing.isActive) throw new AppError("Style is already archived", 400);

  await prisma.style.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });

  return successResponse(res, 200, "Style archived successfully");
};

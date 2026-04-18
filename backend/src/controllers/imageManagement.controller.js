import prisma from "../config/prisma.js";
import AppError from "../utils/AppError.js";
import { successResponse } from "../utils/apiResponse.js";
import {
  uploadMultipleImages,
  deleteImages,
} from "../services/cloudinary.service.js";

// ─── Generic image management handler ─────────────────────────────────────
// Used by styles, ready-to-wear, and portfolio
// model:     the Prisma model name e.g. 'style', 'readyToWear', 'portfolio'
// recordId:  the record's id from req.params.id

const manageImages = async ({ model, recordId, urlsToDelete, newFiles }) => {
  // 1. Fetch the current record
  const record = await prisma[model].findUnique({
    where: { id: recordId },
    select: { id: true, images: true },
  });

  if (!record) throw new AppError("Record not found", 404);

  let updatedImages = [...record.images];

  // 2. Handle deletions
  if (urlsToDelete && urlsToDelete.length > 0) {
    // Validate that all URLs being deleted actually belong to this record
    // Prevents an admin from accidentally (or maliciously) passing URLs
    // from a different record's images
    const invalidUrls = urlsToDelete.filter(
      (url) => !record.images.includes(url),
    );

    if (invalidUrls.length > 0) {
      throw new AppError(
        `These image URLs do not belong to this record: ${invalidUrls.join(", ")}`,
        400,
      );
    }

    // Delete from Cloudinary
    await deleteImages(urlsToDelete);

    // Remove from our local array
    updatedImages = updatedImages.filter((url) => !urlsToDelete.includes(url));
  }

  // 3. Handle new uploads (replacement images)
  if (newFiles && newFiles.length > 0) {
    const folderMap = {
      style: "styles",
      readyToWear: "ready-to-wear",
      portfolio: "portfolio",
    };

    const uploadResults = await uploadMultipleImages(
      newFiles,
      folderMap[model] || model,
    );

    const newUrls = uploadResults.map((r) => r.secure_url);
    updatedImages = [...updatedImages, ...newUrls];
  }

  // 4. Enforce minimum image requirement — records should always have at least one image
  if (updatedImages.length === 0) {
    throw new AppError(
      "Cannot remove all images. At least one image must remain.",
      400,
    );
  }

  // 5. Update the database
  const updated = await prisma[model].update({
    where: { id: recordId },
    data: { images: updatedImages },
  });

  return updated;
};

// ─── Style images ──────────────────────────────────────────────────────────
export const manageStyleImages = async (req, res) => {
  let urlsToDelete = [];
  if (req.body.imageUrls) {
    try {
      urlsToDelete = JSON.parse(req.body.imageUrls);
    } catch {
      throw new AppError("Invalid imageUrls format — expected a JSON array of URLs", 400);
    }
  }

  const updated = await manageImages({
    model: "style",
    recordId: req.params.id,
    urlsToDelete,
    newFiles: req.files || [],
  });

  return successResponse(res, 200, "Style images updated successfully", {
    style: updated,
  });
};

// ─── Ready-to-wear images ──────────────────────────────────────────────────
export const manageReadyToWearImages = async (req, res) => {
  let urlsToDelete = [];
  if (req.body.imageUrls) {
    try {
      urlsToDelete = JSON.parse(req.body.imageUrls);
    } catch {
      throw new AppError("Invalid imageUrls format — expected a JSON array of URLs", 400);
    }
  }

  const updated = await manageImages({
    model: "readyToWear",
    recordId: req.params.id,
    urlsToDelete,
    newFiles: req.files || [],
  });

  return successResponse(res, 200, "Item images updated successfully", {
    item: updated,
  });
};

// ─── Portfolio images ──────────────────────────────────────────────────────
export const managePortfolioImages = async (req, res) => {
  let urlsToDelete = [];
  if (req.body.imageUrls) {
    try {
      urlsToDelete = JSON.parse(req.body.imageUrls);
    } catch {
      throw new AppError("Invalid imageUrls format — expected a JSON array of URLs", 400);
    }
  }

  const updated = await manageImages({
    model: "portfolio",
    recordId: req.params.id,
    urlsToDelete,
    newFiles: req.files || [],
  });

  return successResponse(res, 200, "Portfolio images updated successfully", {
    entry: updated,
  });
};

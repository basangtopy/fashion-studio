import prisma from "../config/prisma.js";
import AppError from "../utils/AppError.js";
import { successResponse } from "../utils/apiResponse.js";
import { computeMeasurementDiff } from "../utils/measurementDiff.js";
import {
  exportMeasurementsToCSV,
  exportMeasurementsToPDF,
} from "../utils/exportUtils.js";

// ─── Helper: check access ──────────────────────────────────────────────────
// Clients can only access their own measurements
// Admins can access any client's measurements
const checkMeasurementAccess = (requestingUser, clientId) => {
  if (requestingUser.role === "CLIENT" && requestingUser.userId !== clientId) {
    throw new AppError("You can only access your own measurements", 403);
  }
};

// ─── GET /measurements ──────────────────────────────────────────────────
// Only for admin
export const getAllMeasurements = async (req, res) => {
  const { search, limit = 12, page = 1 } = req.query;

  const where = {};

  if (search) {
    where.OR = [
      { client: { fullName: { contains: search, mode: "insensitive" } } },
      { client: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  // Pagination logic
  const parsedPage = Math.max(parseInt(page) || 1, 1);
  const parsedLimit = Math.max(parseInt(limit) || 12, 1);
  const skip = (parsedPage - 1) * parsedLimit;

  const [measurements, total] = await Promise.all([
    prisma.measurement.findMany({
      where,
      include: {
        client: { select: { id: true, fullName: true, email: true, profilePicture: true } },
      },
      take: parsedLimit,
      skip: skip,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    }),
    prisma.measurement.count({ where }),
  ]);
  return successResponse(res, 200, "Measurements retrieved", {
    measurements,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      pages: Math.ceil(total / parsedLimit)
    },
  });
};

// ─── GET /measurements/:clientId ──────────────────────────────────────────
export const getMeasurements = async (req, res) => {
  const { clientId } = req.params;

  checkMeasurementAccess(req.user, clientId);

  // Confirm the client exists
  const client = await prisma.user.findUnique({
    where: { id: clientId, role: "CLIENT" },
    select: { id: true, fullName: true, email: true, profilePicture: true },
  });

  if (!client) {
    throw new AppError("Client not found", 404);
  }

  const measurement = await prisma.measurement.findFirst({
    where: { clientId },
  });

  // It's valid for a client to have no measurements yet
  // Return null data rather than 404 so the frontend can handle it gracefully
  return successResponse(res, 200, "Measurements retrieved", {
    client,
    measurement: measurement || null,
  });
};

// ─── POST /measurements/:clientId ─────────────────────────────────────────
// Admin only — creates the initial measurement record for a client
export const createMeasurements = async (req, res) => {
  const { clientId } = req.params;

  // Confirm the client exists
  const client = await prisma.user.findUnique({
    where: { id: clientId, role: "CLIENT" },
    select: { id: true, fullName: true },
  });

  if (!client) {
    throw new AppError("Client not found", 404);
  }

  // Prevent creating a duplicate — one record per client
  const existing = await prisma.measurement.findFirst({
    where: { clientId },
  });

  if (existing) {
    throw new AppError(
      "Measurement record already exists for this client. Use PUT to update.",
      409,
    );
  }

  const { notes, customParams, ...measurementData } = req.validatedBody;

  const measurement = await prisma.measurement.create({
    data: {
      clientId,
      ...measurementData,
      customParams: customParams || null,
      notes: notes || null,
      updatedById: req.user.userId,
      updatedByRole: req.user.role,
    },
  });

  // Log the creation as the first history entry
  await prisma.measurementHistory.create({
    data: {
      measurementId: measurement.id,
      clientId,
      changedFields: measurementData, // entire record is "new" on creation
      updatedById: req.user.userId,
      updatedByRole: req.user.role,
      updatedByName: req.user.fullName,
      notes: notes || null,
    },
  });

  return successResponse(res, 201, "Measurements created successfully", {
    measurement,
  });
};

// ─── PUT /measurements/:clientId ──────────────────────────────────────────
export const updateMeasurements = async (req, res) => {
  const { clientId } = req.params;

  checkMeasurementAccess(req.user, clientId);

  // ── Disclaimer check for client self-updates ──
  if (req.user.role === "CLIENT") {
    if (!req.validatedBody.disclaimerSigned) {
      throw new AppError(
        "You must accept the disclaimer before updating your own measurements",
        400,
      );
    }
  }

  // Confirm measurement record exists
  const existing = await prisma.measurement.findFirst({
    where: { clientId },
  });

  if (!existing) {
    throw new AppError(
      "No measurement record found for this client. An admin must create it first.",
      404,
    );
  }

  // Pull out non-measurement fields from the validated body
  const { disclaimerSigned, notes, customParams, ...measurementData } =
    req.validatedBody;

  // Compute what actually changed for the history log
  const diff = computeMeasurementDiff(existing, {
    ...measurementData,
    customParams,
  });

  // If nothing changed, no need to write to the database
  if (Object.keys(diff).length === 0) {
    return successResponse(res, 200, "No changes detected", {
      measurement: existing,
    });
  }

  // Build the update data — only include fields that were provided
  const updateData = {
    ...measurementData,
    updatedById: req.user.userId,
    updatedByRole: req.user.role,
    notes: notes !== undefined ? notes : existing.notes,
  };

  // Only update customParams if provided
  if (customParams !== undefined) {
    updateData.customParams = customParams;
  }

  // Record disclaimer timestamp for client self-updates
  if (req.user.role === "CLIENT" && disclaimerSigned) {
    updateData.disclaimerSignedAt = new Date();
  }

  const updated = await prisma.measurement.update({
    where: { id: existing.id },
    data: updateData,
  });

  // Log the change to history
  await prisma.measurementHistory.create({
    data: {
      measurementId: existing.id,
      clientId,
      changedFields: diff,
      updatedById: req.user.userId,
      updatedByRole: req.user.role,
      updatedByName: req.user.fullName,
      disclaimerSignedAt: req.user.role === "CLIENT" ? new Date() : null,
      notes: notes || null,
    },
  });

  return successResponse(res, 200, "Measurements updated successfully", {
    measurement: updated,
  });
};

// ─── GET /measurements/:clientId/history ──────────────────────────────────
export const getMeasurementHistory = async (req, res) => {
  const { clientId } = req.params;

  checkMeasurementAccess(req.user, clientId);

  const measurement = await prisma.measurement.findFirst({
    where: { clientId },
    select: { id: true },
  });

  if (!measurement) {
    throw new AppError("No measurement record found for this client", 404);
  }

  const history = await prisma.measurementHistory.findMany({
    where: { measurementId: measurement.id },
    orderBy: { createdAt: "desc" }, // most recent first
  });

  return successResponse(res, 200, "Measurement history retrieved", {
    history,
  });
};

// ─── GET /measurements/export ─────────────────────────────────────────────
// Admin only — exports all (or filtered) client measurements as CSV
export const exportMeasurements = async (req, res) => {
  // ?clientId=xxx for single client, ?format=pdf or ?format=csv (default: csv)
  const { clientId, format = "csv" } = req.query;

  if (!["csv", "pdf"].includes(format)) {
    throw new AppError("Invalid format. Use csv or pdf.", 400);
  }

  const whereClause = clientId ? { clientId } : {};

  const measurements = await prisma.measurement.findMany({
    where: whereClause,
    include: {
      client: {
        select: { fullName: true, email: true, phone: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  if (measurements.length === 0) {
    throw new AppError("No measurements found to export", 404);
  }

  const filename = clientId
    ? `measurements-${clientId}`
    : `all-measurements-${new Date().toISOString().split("T")[0]}`;

  if (format === "pdf") {
    await exportMeasurementsToPDF(res, measurements, filename);
  } else {
    exportMeasurementsToCSV(res, measurements, filename);
  }
};

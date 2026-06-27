import {Prisma} from "../config/prisma.js";

export const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  // ── Prisma known errors (constraint violations, not-found, etc.) ──
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      // Unique constraint violation — e.g. duplicate email
      const field = err.meta?.target?.[0] || "field";
      return res.status(409).json({
        success: false,
        message: `A record with this ${field} already exists.`,
      });
    }
    if (err.code === "P2025") {
      // Record not found (e.g. update/delete on non-existent row)
      return res.status(404).json({
        success: false,
        message: "Record not found.",
      });
    }
    // All other Prisma errors — don't expose internal details
    console.error("Prisma error:", err.code, err.message);
    return res.status(500).json({
      success: false,
      message: "A database error occurred.",
    });
  }

  // ── Prisma validation errors (bad input type sent to query) ──
  if (err instanceof Prisma.PrismaClientValidationError) {
    console.error("Prisma validation error:", err.message);
    return res.status(400).json({
      success: false,
      message: "Invalid data provided.",
    });
  }

  // ── All other errors (AppError, Zod, etc.) ──
  const statusCode = err.statusCode || err.status || 500;
  const response = {
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  };

  if (statusCode >= 500) {
    console.error("Server Error:", err);
  }

  res.status(statusCode).json(response);
};

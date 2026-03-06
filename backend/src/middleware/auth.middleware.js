import { verifyAccessToken } from "../utils/tokens.js";
import prisma from "../config/prisma.js";
import AppError from "../utils/AppError.js";

// ─── Authenticate ──────────────────────────────────────────────────────────

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Access token required", 401);
  }

  const token = authHeader.split(" ")[1];

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new AppError("Access token has expired", 401);
    }
    throw new AppError("Invalid access token", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: {
      id: true,
      role: true,
      email: true,
      fullName: true,
      isEmailVerified: true,
    },
  });

  if (!user) {
    throw new AppError("User no longer exists", 401);
  }

  req.user = {
    userId: user.id,
    role: user.role,
    email: user.email,
    fullName: user.fullName,
    isEmailVerified: user.isEmailVerified,
  };

  next();
};

// ─── Authorise ─────────────────────────────────────────────────────────────

export const authorise =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(
        "You do not have permission to perform this action",
        403,
      );
    }

    next();
  };

// ─── Email Verification ────────────────────────────────────────────────────

export const requireEmailVerified = (req, res, next) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  // Admin bypass — admins don't strictly need email verification to do admin tasks
  if (req.user.role === "SUPER_ADMIN" || req.user.role === "STAFF_ADMIN") {
    return next();
  }

  if (!req.user.isEmailVerified) {
    throw new AppError(
      "Please verify your email address to perform this action",
      403,
    );
  }

  next();
};

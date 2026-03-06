import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";
import AppError from "../utils/AppError.js";
import { successResponse } from "../utils/apiResponse.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} from "../utils/tokens.js";
import { generateToken, hashToken } from "../utils/tokenGenerator.js";
import { sendEmail } from "../services/email.service.js";
import {
  passwordResetTemplate,
  emailVerificationTemplate,
} from "../utils/emailTemplates.js";

// ─── Helper ────────────────────────────────────────────────────────────────

const sanitizeUser = (user) => {
  const {
    passwordHash,
    refreshToken,
    refreshTokenExpiry,
    emailVerifyToken,
    resetToken,
    resetTokenExpiry,
    ...safeUser
  } = user;
  return safeUser;
};

// ─── Register ──────────────────────────────────────────────────────────────

export const register = async (req, res) => {
  const { fullName, email, password, phone, sex } = req.validatedBody;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError("An account with this email already exists", 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Generate email verification token
  const { rawToken: verifyRaw, hashedToken: verifyHashed } = generateToken();

  // Create user without refresh token — we'll set it after generating with the real user ID
  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash,
      phone,
      sex,
      role: "CLIENT",
      authProvider: "LOCAL",
      emailVerifyToken: verifyHashed,
    },
  });

  // Now generate tokens with the actual user ID
  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.user.update({
    where: { id: user.id },
    data: {
      refreshToken: refreshTokenHash,
      refreshTokenExpiry,
    },
  });

  setRefreshTokenCookie(res, refreshToken);

  // Send verification email (fire-and-forget — don't block registration)
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verifyRaw}`;
  sendEmail({
    to: email,
    subject: "Verify Your Email Address",
    html: emailVerificationTemplate({ clientName: fullName, verifyUrl }),
  });

  return successResponse(res, 201, "Account created successfully", {
    accessToken,
    user: sanitizeUser(user),
  });
};

// ─── Login ─────────────────────────────────────────────────────────────────

export const login = async (req, res) => {
  const { email, password } = req.validatedBody;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: refreshTokenHash, refreshTokenExpiry },
  });

  setRefreshTokenCookie(res, refreshToken);

  return successResponse(res, 200, "Login successful", {
    accessToken,
    user: sanitizeUser(user),
  });
};

// ─── Refresh Token ─────────────────────────────────────────────────────────

export const refresh = async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    throw new AppError("No refresh token provided", 401);
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  if (!user || !user.refreshToken) {
    throw new AppError("Invalid refresh token", 401);
  }

  if (new Date() > new Date(user.refreshTokenExpiry)) {
    throw new AppError("Refresh token has expired, please login again", 401);
  }
  const isTokenValid = await bcrypt.compare(token, user.refreshToken);
  if (!isTokenValid) {
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: null, refreshTokenExpiry: null },
    });
    throw new AppError("Invalid refresh token", 401);
  }

  const newAccessToken = generateAccessToken(user.id, user.role);
  const newRefreshToken = generateRefreshToken(user.id);
  const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
  const newRefreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      refreshToken: newRefreshTokenHash,
      refreshTokenExpiry: newRefreshTokenExpiry,
    },
  });

  setRefreshTokenCookie(res, newRefreshToken);

  return successResponse(res, 200, "Token refreshed successfully", {
    accessToken: newAccessToken,
  });
};

// ─── Logout ────────────────────────────────────────────────────────────────

export const logout = async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (token) {
    try {
      const decoded = verifyRefreshToken(token);
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { refreshToken: null, refreshTokenExpiry: null },
      });
    } catch { }
  }

  clearRefreshTokenCookie(res);
  return successResponse(res, 200, "Logged out successfully");
};

// ─── Get Current User ──────────────────────────────────────────────────────

export const getMe = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return successResponse(res, 200, "User retrieved successfully", {
    user: sanitizeUser(user),
  });
};

// ─── Forgot Password ──────────────────────────────────────────────────────
// Accepts { email }. Generates a crypto token, stores hash + 1hr expiry,
// sends reset email. ALWAYS returns 200 (email enumeration prevention).

export const forgotPassword = async (req, res) => {
  const { email } = req.validatedBody;

  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success — even if email doesn't exist in our DB.
  // This prevents attackers from discovering which emails are registered.
  if (user) {
    const { rawToken, hashedToken } = generateToken();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: hashedToken, resetTokenExpiry },
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;
    sendEmail({
      to: email,
      subject: "Reset Your Password",
      html: passwordResetTemplate({ clientName: user.fullName, resetUrl }),
    });
  }

  return successResponse(
    res,
    200,
    "If an account exists with that email, a reset link has been sent",
  );
};

// ─── Reset Password ────────────────────────────────────────────────────────
// Accepts { token, newPassword }. Verifies the hashed token + expiry,
// updates the password, and clears the reset fields.

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.validatedBody;

  // Hash the incoming token to compare with what's stored in DB
  const hashedToken = hashToken(token);

  const user = await prisma.user.findFirst({
    where: {
      resetToken: hashedToken,
      resetTokenExpiry: { gt: new Date() }, // token must not be expired
    },
  });

  if (!user) {
    throw new AppError("Invalid or expired reset token", 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null, // one-time use — clear after use
      resetTokenExpiry: null,
      // Also invalidate any existing refresh tokens (force re-login)
      refreshToken: null,
      refreshTokenExpiry: null,
    },
  });

  return successResponse(
    res,
    200,
    "Password reset successful. Please log in with your new password.",
  );
};

// ─── Send Verification Email ───────────────────────────────────────────────
// Authenticated user requests a (new) verification email.

export const sendVerificationEmail = async (req, res) => {
  const userId = req.user.userId;

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.isEmailVerified) {
    return successResponse(res, 200, "Email is already verified");
  }

  const { rawToken, hashedToken } = generateToken();

  await prisma.user.update({
    where: { id: userId },
    data: { emailVerifyToken: hashedToken },
  });

  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${rawToken}`;
  sendEmail({
    to: user.email,
    subject: "Verify Your Email Address",
    html: emailVerificationTemplate({ clientName: user.fullName, verifyUrl }),
  });

  return successResponse(res, 200, "Verification email sent");
};

// ─── Verify Email ──────────────────────────────────────────────────────────
// Accepts { token }. Hashes the incoming token, finds a matching user,
// sets isEmailVerified = true, and clears the verification token.

export const verifyEmail = async (req, res) => {
  const { token } = req.validatedBody;

  const hashedToken = hashToken(token);

  const user = await prisma.user.findFirst({
    where: { emailVerifyToken: hashedToken },
  });

  if (!user) {
    throw new AppError("Invalid or expired verification token", 400);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      emailVerifyToken: null, // one-time use
    },
  });

  return successResponse(res, 200, "Email verified successfully");
};

import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "../config/prisma.js";
import AppError from "../utils/AppError.js";
import { successResponse } from "../utils/apiResponse.js";
import {
  generateAccessToken,
  generateRefreshToken,
  setRefreshTokenCookie,
} from "../utils/tokens.js";

export const oauthCallback = async (req, res) => {
  // req.user is set by Passport after a successful OAuth flow
  // It contains the user record from our database (returned by handleOAuthUser)
  const user = req.user;

  if (!user) {
    // Something went wrong in the OAuth flow before we got here
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  }

  // Redirect to frontend with short-lived oauthCode in URL query param
  // The frontend reads this code from the URL and exchanges it for an access token.

  // AFTER — store the token server-side keyed by a random code:
  const oauthCode = crypto.randomBytes(24).toString("hex");

  // Store temporarily (expires in 2 minutes)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      oauthCode,
      oauthCodeExpiry: new Date(Date.now() + 2 * 60 * 1000),
    },
  });

  return res.redirect(
    `${process.env.FRONTEND_URL}/auth/callback?code=${oauthCode}`,
  );
};

export const oauthFailure = (req, res) => {
  return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
};

// POST /auth/oauth/exchange
export const oauthCodeExchange = async (req, res, next) => {
  try {
    const { code } = req.validatedBody;
    if (!code) throw new AppError("Code required", 400);

    const user = await prisma.user.findFirst({
      where: {
        oauthCode: code,
        oauthCodeExpiry: { gt: new Date() },
      },
      select: { id: true, role: true },
    });

    if (!user) throw new AppError("Invalid or expired code", 400);
    
    // Generate our own tokens — identical to credentials login from here
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Clear the oauthCode and store the refresh token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: refreshTokenHash,
        refreshTokenExpiry,
        oauthCode: null,
        oauthCodeExpiry: null,
      },
    });

    setRefreshTokenCookie(res, refreshToken);

    return successResponse(res, 200, "Token issued", { accessToken });
  } catch (err) {
    next(err);
  }
}

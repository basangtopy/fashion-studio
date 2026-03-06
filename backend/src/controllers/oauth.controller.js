import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";
import AppError from "../utils/AppError.js";
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

  // Generate our own tokens — identical to credentials login from here
  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: refreshTokenHash, refreshTokenExpiry },
  });

  setRefreshTokenCookie(res, refreshToken);

  // Redirect to frontend with access token in URL query param
  // The frontend reads this token from the URL, stores it in memory,
  // then immediately cleans the URL
  return res.redirect(
    `${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}`,
  );
};

export const oauthFailure = (req, res) => {
  return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
};

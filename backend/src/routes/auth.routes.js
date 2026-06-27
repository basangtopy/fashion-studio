import { Router } from "express";
import {
  register,
  login,
  refresh,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
} from "../controllers/auth.controller.js";
import { oauthCodeExchange } from "../controllers/oauth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  oauthCodeExchangeSchema,
} from "../validators/auth.validators.js";
import {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  verificationEmailLimiter,
} from "../middleware/rateLimiter.js";

const router = Router();

// Public routes — no authentication needed
router.post("/register", registerLimiter, validate(registerSchema), register);
router.post("/login", loginLimiter, validate(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", logout);

// Password reset — public (user isn't logged in if they forgot their password)
router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  validate(forgotPasswordSchema),
  forgotPassword,
);
router.post(
  "/reset-password",
  resetPasswordLimiter,
  validate(resetPasswordSchema),
  resetPassword,
);

// Email verification — verify-email is public (token in body from frontend)
router.post("/verify-email", validate(verifyEmailSchema), verifyEmail);

// OAuth route
router.post("/oauth/exchange", validate(oauthCodeExchangeSchema), oauthCodeExchange);

// Protected routes — requires valid access token
router.get("/me", authenticate, getMe);
router.post(
  "/send-verification",
  authenticate,
  verificationEmailLimiter,
  sendVerificationEmail,
);

export default router;

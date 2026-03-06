import rateLimit from "express-rate-limit";

// ─── Rate Limiters ─────────────────────────────────────────────────────────
//
// Each limiter tracks requests per IP address within a time window.
// When the limit is exceeded, the client gets a 429 (Too Many Requests).
//
// Standard headers (RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset)
// are included in responses so the frontend can show remaining attempts.

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: "Too many login attempts. Please try again in 15 minutes.",
  },
  standardHeaders: true, // Include RateLimit-* headers (IETF standard)
  legacyHeaders: false, // Disable X-RateLimit-* headers (deprecated)
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  message: {
    success: false,
    message: "Too many accounts created from this IP. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 reset requests per window
  message: {
    success: false,
    message:
      "Too many password reset requests. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many reset attempts. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const verificationEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // only 3 resend requests per hour
  message: {
    success: false,
    message: "Too many verification email requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 10, // Max 10 orders/checkout attempts per 15 mins
  message: {
    success: false,
    message: "Too many order requests. Please wait a few minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const generalActionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 mins
  max: 30, // 30 actions (chats, testimonials) per 5 mins
  message: {
    success: false,
    message: "You are doing that too fast. Please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

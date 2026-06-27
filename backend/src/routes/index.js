import { Router } from "express";
import rateLimit from "express-rate-limit";

import authRoutes from "./auth.routes.js";
import oauthRoutes from "./oauth.routes.js";
import userRoutes from "./user.routes.js";
import measurementRoutes from "./measurement.routes.js";
import appointmentRoutes from "./appointment.routes.js";
import styleRoutes from "./style.routes.js";
import readyToWearRoutes from "./readyToWear.routes.js";
import portfolioRoutes from "./portfolio.routes.js";
import orderRoutes from "./order.routes.js";
import adminOrderRoutes from "./adminOrder.routes.js";
import paymentRoutes from "./payment.routes.js";
import adminPaymentRoutes from "./adminPayment.routes.js";
import sseRoutes from "./sse.routes.js";
import chatRoutes from "./chat.routes.js";
import notificationRoutes from "./notification.routes.js";
import testimonialRoutes from "./testimonial.routes.js";
import cartRoutes from "./cart.routes.js";
import dashboardRoutes from "./dashboard.routes.js";

const router = Router();

// ─── Global API rate limiter ───────────────────────────────────────────────
// Applies to every /api/* route as a catch-all.
// Per-route limiters (login, register) are stricter and take precedence
// because they're mounted on specific routes before this runs.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,                  // 300 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please slow down.",
  },
  // Skip the SSE endpoint — it's a long-lived connection, not a request-per-call pattern
  skip: (req) => req.path === "/sse",
});

router.use(globalLimiter);

// API status check
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Fashion Studio API is running",
    version: "1.0.0",
  });
});

// We'll mount feature routers here as we build them
router.use("/auth", authRoutes);
router.use("/auth", oauthRoutes);
router.use("/users", userRoutes);
router.use("/measurements", measurementRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/styles", styleRoutes);
router.use("/ready-to-wear", readyToWearRoutes);
router.use("/portfolio", portfolioRoutes);
router.use("/orders", orderRoutes);
router.use("/admin/orders", adminOrderRoutes);
router.use("/payments", paymentRoutes);
router.use("/admin/payments", adminPaymentRoutes);
router.use("/sse", sseRoutes);
router.use("/chat", chatRoutes);
router.use("/notifications", notificationRoutes);
router.use("/testimonials", testimonialRoutes);
router.use("/cart", cartRoutes);
router.use("/admin/dashboard", dashboardRoutes);

export default router;

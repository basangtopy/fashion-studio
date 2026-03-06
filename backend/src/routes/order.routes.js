import { Router } from "express";
import {
  createOrder,
  getClientOrders,
  getClientOrder,
  acceptQuote,
  declineQuote,
} from "../controllers/order.controller.js";
import {
  authenticate,
  requireEmailVerified,
} from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.js";
import {
  createOrderSchema,
  declineQuoteSchema,
} from "../validators/order.validators.js";
import { orderLimiter } from "../middleware/rateLimiter.js";
import { uploadMultiple } from "../middleware/upload.middleware.js";

const router = Router();

router.use(authenticate);

// Applying order limiter and email verification requirement to order creation
// uploadMultiple parses multipart form data so clients can attach custom style images
router.post(
  "/",
  requireEmailVerified,
  orderLimiter,
  uploadMultiple("customStyleImages"),
  validate(createOrderSchema),
  createOrder,
);

router.get("/", getClientOrders);
router.get("/:id", getClientOrder);

// Applying email verification requirement to quote responses
router.put("/:id/accept-quote", requireEmailVerified, acceptQuote);
router.put(
  "/:id/decline-quote",
  requireEmailVerified,
  validate(declineQuoteSchema),
  declineQuote,
);

export default router;

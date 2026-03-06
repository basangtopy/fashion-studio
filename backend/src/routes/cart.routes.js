import { Router } from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  checkout,
} from "../controllers/cart.controller.js";
import {
  authenticate,
  requireEmailVerified,
} from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.js";
import {
  addToCartSchema,
  updateCartItemSchema,
  checkoutSchema,
} from "../validators/cart.validators.js";
import { orderLimiter } from "../middleware/rateLimiter.js";

const router = Router();

// All cart routes require authentication — this is a client-only feature
router.use(authenticate);

router.get("/", getCart);
router.post("/items", validate(addToCartSchema), addToCart);
router.put("/items/:itemId", validate(updateCartItemSchema), updateCartItem);
router.delete("/items/:itemId", removeCartItem);
router.delete("/", clearCart);
router.post(
  "/checkout",
  requireEmailVerified,
  orderLimiter,
  validate(checkoutSchema),
  checkout,
);

export default router;

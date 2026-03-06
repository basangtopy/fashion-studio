import { Router } from "express";
import {
  getAdminOrders,
  getAdminOrder,
  updateOrderStatus,
  setOrderQuote,
  setDeliveryFee,
  adminCreateOrder,
} from "../controllers/order.controller.js";
import { authenticate, authorise } from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.js";
import {
  createOrderSchema,
  updateStatusSchema,
  quoteOrderSchema,
  deliveryFeeSchema,
} from "../validators/order.validators.js";
import { uploadMultiple } from "../middleware/upload.middleware.js";

const router = Router();

router.use(authenticate, authorise("STAFF_ADMIN", "SUPER_ADMIN"));

router.get("/", getAdminOrders);
router.get("/:id", getAdminOrder);
router.put("/:id/status", validate(updateStatusSchema), updateOrderStatus);
router.put("/:id/quote", validate(quoteOrderSchema), setOrderQuote);
router.put("/:id/delivery-fee", validate(deliveryFeeSchema), setDeliveryFee);
router.post("/client/:clientId", uploadMultiple("customStyleImages"), validate(createOrderSchema), adminCreateOrder);

export default router;

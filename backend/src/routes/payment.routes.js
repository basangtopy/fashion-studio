import { Router } from "express";
import {
  submitPayment,
  getOrderPayments,
} from "../controllers/payment.controller.js";
import {
  authenticate,
  requireEmailVerified,
} from "../middleware/auth.middleware.js";
import { uploadSingle } from "../middleware/upload.middleware.js";
import validate from "../middleware/validate.js";
import { submitPaymentSchema } from "../validators/payment.validators.js";

const router = Router();

router.use(authenticate);

// Proof upload is optional — uploadSingle runs but req.file may be undefined
router.post(
  "/",
  requireEmailVerified,
  uploadSingle("proof"),
  validate(submitPaymentSchema),
  submitPayment,
);

router.get("/order/:orderId", getOrderPayments);

export default router;

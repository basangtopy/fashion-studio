import { Router } from "express";
import {
  getAdminPayments,
  confirmPayment,
  rejectPayment,
  logOfflinePayment,
  exportPayments,
  getFinanceSummary,
} from "../controllers/payment.controller.js";
import { authenticate, authorise } from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.js";
import {
  rejectPaymentSchema,
  offlinePaymentSchema,
  financeSummarySchema,
} from "../validators/payment.validators.js";

const router = Router();

// All admin payment routes: Super Admin only
router.use(authenticate, authorise("SUPER_ADMIN"));

// export and offline must be defined BEFORE /:id routes
router.get("/export", exportPayments);
router.get("/summary", validate(financeSummarySchema, "query"), getFinanceSummary);
router.post("/offline", validate(offlinePaymentSchema), logOfflinePayment);

router.get("/", getAdminPayments);
router.put("/:id/confirm", confirmPayment);
router.put("/:id/reject", validate(rejectPaymentSchema), rejectPayment);

export default router;

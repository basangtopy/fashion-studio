import { Router } from "express";
import {
  getMessages,
  sendMessage,
  markAsRead,
  getAdminInbox,
} from "../controllers/chat.controller.js";
import { authenticate, authorise } from "../middleware/auth.middleware.js";
import { uploadMultiple } from "../middleware/upload.middleware.js";
import { generalActionLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.use(authenticate);

// Admin inbox — specific route BEFORE /:orderId
router.get(
  "/admin/inbox",
  authorise("STAFF_ADMIN", "SUPER_ADMIN"),
  getAdminInbox,
);

router.get("/:orderId", getMessages);
router.post(
  "/:orderId",
  generalActionLimiter,
  uploadMultiple("attachments"),
  sendMessage,
);
router.put("/:orderId/read", markAsRead);

export default router;

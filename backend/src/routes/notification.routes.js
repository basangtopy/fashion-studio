import { Router } from "express";
import {
  getNotifications,
  markOneRead,
  markAllRead,
} from "../controllers/notification.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

// 'read-all' BEFORE /:id — otherwise 'read-all' matches as id = 'read-all'
router.get("/", getNotifications);
router.put("/read-all", markAllRead);
router.put("/:id/read", markOneRead);

export default router;

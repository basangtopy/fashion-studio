import { Router } from "express";
import {
  getDashboardStats,
  exportDashboard,
} from "../controllers/dashboard.controller.js";
import { authenticate, authorise } from "../middleware/auth.middleware.js";

const router = Router();

// All dashboard routes require admin auth
router.use(authenticate, authorise("STAFF_ADMIN", "SUPER_ADMIN"));

router.get("/", getDashboardStats);
router.get("/export", exportDashboard);

export default router;

import { Router } from "express";
import {
  getDashboardStats,
  exportDashboard,
  getOnlineClientsCount,
  globalSearch,
} from "../controllers/dashboard.controller.js";
import { authenticate, authorise } from "../middleware/auth.middleware.js";

const router = Router();

// All dashboard routes require admin auth
router.use(authenticate, authorise("STAFF_ADMIN", "SUPER_ADMIN"));

router.get("/search", globalSearch);
router.get("/", getDashboardStats);
router.get("/export", exportDashboard);
router.get("/online-count", getOnlineClientsCount);

export default router;

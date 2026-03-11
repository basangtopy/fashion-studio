import { Router } from "express";
import {
  getAllMeasurements,
  getMeasurements,
  createMeasurements,
  updateMeasurements,
  getMeasurementHistory,
  exportMeasurements,
} from "../controllers/measurement.controller.js";
import { authenticate, authorise } from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.js";
import {
  createMeasurementSchema,
  updateMeasurementSchema,
} from "../validators/measurement.validators.js";

const router = Router();

// All measurement routes require authentication
router.use(authenticate);

// Admin-only route to get all measurements with pagination and search
router.get(
  "/",
  authorise("STAFF_ADMIN", "SUPER_ADMIN"),
  getAllMeasurements,
);

// Export — must be defined BEFORE /:clientId routes
router.get(
  "/export",
  authorise("STAFF_ADMIN", "SUPER_ADMIN"),
  exportMeasurements,
);

// Get a client's measurements (client: own only; admin: any)
router.get("/:clientId", getMeasurements);

// Create initial measurements — admin only
router.post(
  "/:clientId",
  authorise("STAFF_ADMIN", "SUPER_ADMIN"),
  validate(createMeasurementSchema),
  createMeasurements,
);

// Update measurements (client with disclaimer, or admin directly)
router.put("/:clientId", validate(updateMeasurementSchema), updateMeasurements);

// Full update history
router.get("/:clientId/history", getMeasurementHistory);

export default router;

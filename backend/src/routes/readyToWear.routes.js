import { Router } from "express";
import {
  getReadyToWearItems,
  getReadyToWearItemsAdmin,
  getReadyToWearCategories,
  getReadyToWearItem,
  createReadyToWearItem,
  updateReadyToWearItem,
} from "../controllers/readyToWear.controller.js";
import { authenticate, authorise } from "../middleware/auth.middleware.js";
import { uploadMultiple } from "../middleware/upload.middleware.js";
import validate from "../middleware/validate.js";
import {
  createReadyToWearSchema,
  updateReadyToWearSchema,
} from "../validators/catalog.validators.js";
import { manageReadyToWearImages } from "../controllers/imageManagement.controller.js";

const router = Router();

router.get(
  "/admin",
  authenticate,
  authorise("STAFF_ADMIN", "SUPER_ADMIN"),
  getReadyToWearItemsAdmin
);

router.get("/", getReadyToWearItems);
router.get("/categories", getReadyToWearCategories);
router.get("/:id", getReadyToWearItem);

router.post(
  "/",
  authenticate,
  authorise("STAFF_ADMIN", "SUPER_ADMIN"),
  uploadMultiple("images"),
  validate(createReadyToWearSchema),
  createReadyToWearItem,
);

router.put(
  "/:id",
  authenticate,
  authorise("STAFF_ADMIN", "SUPER_ADMIN"),
  uploadMultiple("images"),
  validate(updateReadyToWearSchema),
  updateReadyToWearItem,
);

router.patch(
  "/:id/images",
  authenticate,
  authorise("STAFF_ADMIN", "SUPER_ADMIN"),
  uploadMultiple("images"),
  manageReadyToWearImages,
);

export default router;

import { Router } from "express";
import {
  getStyles,
  getStyleCategories,
  getStyle,
  createStyle,
  updateStyle,
  deleteStyle,
} from "../controllers/style.controller.js";
import { authenticate, authorise } from "../middleware/auth.middleware.js";
import { uploadMultiple } from "../middleware/upload.middleware.js";
import validate from "../middleware/validate.js";
import {
  createStyleSchema,
  updateStyleSchema,
} from "../validators/catalog.validators.js";
import { manageStyleImages } from "../controllers/imageManagement.controller.js";

const router = Router();

// Public
router.get("/", getStyles);
router.get("/categories", getStyleCategories);
router.get("/:id", getStyle);

// Admin only
router.post(
  "/",
  authenticate,
  authorise("STAFF_ADMIN", "SUPER_ADMIN"),
  uploadMultiple("images"), // multer runs first — parses multipart data
  validate(createStyleSchema), // zod validates the text fields after multer
  createStyle,
);

router.put(
  "/:id",
  authenticate,
  authorise("STAFF_ADMIN", "SUPER_ADMIN"),
  uploadMultiple("images"),
  validate(updateStyleSchema),
  updateStyle,
);

router.delete(
  "/:id",
  authenticate,
  authorise("STAFF_ADMIN", "SUPER_ADMIN"),
  deleteStyle,
);

// Add/remove images for a style
// Send as multipart/form-data:
// - imageUrls: JSON string array of URLs to delete e.g. '["https://...","https://..."]'
// - images: new image files to upload (optional)
router.patch(
  "/:id/images",
  authenticate,
  authorise("STAFF_ADMIN", "SUPER_ADMIN"),
  uploadMultiple("images"),
  manageStyleImages,
);

export default router;

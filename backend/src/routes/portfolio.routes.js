import { Router } from "express";
import {
  getPortfolioEntries,
  getPortfolioCategories,
  getPortfolioEntry,
  createPortfolioEntry,
  updatePortfolioEntry,
  getPortfolioEntriesAdmin,
} from "../controllers/portfolio.controller.js";
import { authenticate, authorise } from "../middleware/auth.middleware.js";
import { uploadMultiple } from "../middleware/upload.middleware.js";
import validate from "../middleware/validate.js";
import {
  createPortfolioSchema,
  updatePortfolioSchema,
} from "../validators/catalog.validators.js";
import { managePortfolioImages } from "../controllers/imageManagement.controller.js";

const router = Router();

router.get("/", getPortfolioEntries);
router.get("/categories", getPortfolioCategories);

router.get("/admin",
  authenticate,
  authorise("STAFF_ADMIN", "SUPER_ADMIN"),
  getPortfolioEntriesAdmin
);

router.get("/:id", getPortfolioEntry);

router.post(
  "/",
  authenticate,
  authorise("STAFF_ADMIN", "SUPER_ADMIN"),
  uploadMultiple("images"),
  validate(createPortfolioSchema),
  createPortfolioEntry,
);

router.put(
  "/:id",
  authenticate,
  authorise("STAFF_ADMIN", "SUPER_ADMIN"),
  uploadMultiple("images"),
  validate(updatePortfolioSchema),
  updatePortfolioEntry,
);

router.patch(
  "/:id/images",
  authenticate,
  authorise("STAFF_ADMIN", "SUPER_ADMIN"),
  uploadMultiple("images"),
  managePortfolioImages,
);

export default router;

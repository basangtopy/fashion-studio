import { Router } from "express";
import {
  getPublicTestimonials,
  submitTestimonial,
  getAdminTestimonials,
  adminCreateTestimonial,
  updateTestimonialStatus,
} from "../controllers/testimonial.controller.js";
import {
  authenticate,
  authorise,
  requireEmailVerified,
} from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.js";
import {
  submitTestimonialSchema,
  adminCreateTestimonialSchema,
  updateTestimonialSchema,
} from "../validators/testimonial.validators.js";
import { generalActionLimiter } from "../middleware/rateLimiter.js";
import { uploadSingle } from "../middleware/upload.middleware.js";

const router = Router();

// Public
router.get("/", getPublicTestimonials);

// Authenticated client
router.post(
  "/",
  authenticate,
  requireEmailVerified,
  generalActionLimiter,
  uploadSingle("reviews"),
  validate(submitTestimonialSchema),
  submitTestimonial,
);

// Admin — specific routes BEFORE dynamic /:id
router.get(
  "/admin",
  authenticate,
  authorise("STAFF_ADMIN", "SUPER_ADMIN"),
  getAdminTestimonials,
);

router.post(
  "/admin",
  authenticate,
  authorise("STAFF_ADMIN", "SUPER_ADMIN"),
  uploadSingle("reviews"),
  validate(adminCreateTestimonialSchema),
  adminCreateTestimonial,
);

router.put(
  "/admin/:id",
  authenticate,
  authorise("STAFF_ADMIN", "SUPER_ADMIN"),
  validate(updateTestimonialSchema),
  updateTestimonialStatus,
);

export default router;

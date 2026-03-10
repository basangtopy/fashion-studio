import { z } from "zod";

// Client submits their own testimonial
export const submitTestimonialSchema = z.object({
  rating: z.coerce
    .number({ required_error: "Rating is required" })
    .int("Rating must be a whole number")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),

  review: z
    .string({ required_error: "Review is required" })
    .min(10, "Review must be at least 10 characters")
    .max(1000, "Review must not exceed 1000 characters")
    .trim(),
    
  // photoUrl is no longer passed in the body; the file is handled via multer
});

// Admin creates a testimonial on behalf of a client
export const adminCreateTestimonialSchema = z.object({
  clientName: z
    .string({ required_error: "Client name is required" })
    .min(2, "Client name must be at least 2 characters")
    .max(100, "Client name must not exceed 100 characters")
    .trim(),

  rating: z.coerce
    .number({ required_error: "Rating is required" })
    .int("Rating must be a whole number")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),

  review: z
    .string({ required_error: "Review is required" })
    .min(10, "Review must be at least 10 characters")
    .max(1000, "Review must not exceed 1000 characters")
    .trim(),

  isFeatured: z
    .preprocess((val) => val === "true" || val === true, z.boolean())
    .optional()
    .default(false),
});

// Admin updates testimonial status or featured flag
export const updateTestimonialSchema = z.object({
  status: z
    .enum(["APPROVED", "REJECTED"], {
      invalid_type_error: "Status must be APPROVED or REJECTED",
    })
    .optional(),

  isFeatured: z.boolean().optional(),
});

import { z } from "zod";

// ─── Style validators ───────────────────────────────────────────────────────

export const createStyleSchema = z.object({
  name: z
    .string({ error: "Style name is required" })
    .min(2, "Name must be at least 2 characters")
    .max(100)
    .trim(),

  description: z
    .string({ error: "Description is required" })
    .min(10, "Description must be at least 10 characters")
    .max(2000)
    .trim(),

  category: z
    .string({ error: "Category is required" })
    .min(2)
    .max(50)
    .trim(),

  availableForModel1: z
    .string()
    .transform((val) => val === "true")
    .default("true"),
  // Note: form data sends everything as strings, even booleans
  // .transform converts "true"/"false" strings to actual booleans

  availableForModel2: z
    .string()
    .transform((val) => val === "true")
    .default("true"),

  isFeatured: z
    .string()
    .transform((val) => val === "true")
    .default("false"),
});

export const updateStyleSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  description: z.string().min(10).max(2000).trim().optional(),
  category: z.string().min(2).max(50).trim().optional(),
  availableForModel1: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  availableForModel2: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  isFeatured: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  isActive: z
    .string()
    .transform((val) => val === "true")
    .optional(),
});

// ─── Ready-to-wear validators ───────────────────────────────────────────────

export const createReadyToWearSchema = z.object({
  name: z
    .string({ error: "Item name is required" })
    .min(2)
    .max(100)
    .trim(),

  description: z
    .string({ error: "Description is required" })
    .min(10)
    .max(2000)
    .trim(),

  price: z
    .string({ error: "Price is required" })
    .transform((val) => parseFloat(val))
    .refine((val) => !isNaN(val) && val > 0, "Price must be a positive number"),

  category: z
    .string({ error: "Category is required" })
    .min(2)
    .max(50)
    .trim(),

  // Sizes sent as a JSON string from multipart form e.g. '["S","M","L","XL"]'
  availableSizes: z
    .string({ error: "Available sizes are required" })
    .transform((val) => {
      try {
        const parsed = JSON.parse(val);
        if (!Array.isArray(parsed)) throw new Error();
        return parsed;
      } catch {
        throw new Error(
          'availableSizes must be a valid JSON array e.g. ["S","M","L"]',
        );
      }
    }),

  fabricDetails: z.string().max(500).trim().optional(),
  careInstructions: z.string().max(500).trim().optional(),

  stockCount: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine(
      (val) => !isNaN(val) && val >= 0,
      "Stock count must be a non-negative integer",
    )
    .default("0"),

  isFeatured: z
    .string()
    .transform((val) => val === "true")
    .default("false"),
});

export const updateReadyToWearSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  description: z.string().min(10).max(2000).trim().optional(),
  price: z
    .string()
    .transform((val) => parseFloat(val))
    .refine((val) => !isNaN(val) && val > 0)
    .optional(),
  category: z.string().min(2).max(50).trim().optional(),
  availableSizes: z
    .string()
    .transform((val) => JSON.parse(val))
    .optional(),
  fabricDetails: z.string().max(500).trim().optional(),
  careInstructions: z.string().max(500).trim().optional(),
  stockCount: z
    .string()
    .transform((val) => parseInt(val, 10))
    .optional(),
  stockStatus: z.enum(["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"]).optional(),
  isFeatured: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  isActive: z
    .string()
    .transform((val) => val === "true")
    .optional(),
});

// ─── Portfolio validators ───────────────────────────────────────────────────

export const createPortfolioSchema = z.object({
  orderId: z.string().cuid("Must be a valid order ID").optional(),

  title: z.string().min(2).max(100).trim().optional(),
  description: z.string().max(1000).trim().optional(),
  category: z
    .string({ error: "Category is required" })
    .min(2)
    .max(50)
    .trim(),

  clientConsent: z
    .string()
    .transform((val) => val === "true")
    .default("false"),

  isPublished: z
    .string()
    .transform((val) => val === "true")
    .default("false"),
  isFeatured: z
    .string()
    .transform((val) => val === "true")
    .default("false"),
});

export const updatePortfolioSchema = z.object({
  title: z.string().min(2).max(100).trim().optional(),
  description: z.string().max(1000).trim().optional(),
  category: z.string().min(2).max(50).trim().optional(),
  clientConsent: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  isPublished: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  isFeatured: z
    .string()
    .transform((val) => val === "true")
    .optional(),
});

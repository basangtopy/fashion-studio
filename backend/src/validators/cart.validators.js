import { z } from "zod";

export const addToCartSchema = z.object({
  readyToWearId: z.string({
    error: "Ready-to-wear item ID is required",
  }),

  selectedSize: z
    .string({ error: "Size is required" })
    .min(1, "Size cannot be empty")
    .trim(),

  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1")
    .optional()
    .default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z
    .number({ error: "Quantity is required" })
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1"),
});

export const checkoutSchema = z.object({
  fulfillmentMethod: z.enum(["PICKUP", "DELIVERY"], {
    error: (issue) =>
      issue.input === undefined
        ? "Fulfillment method is required"
        : "Fulfillment method must be PICKUP or DELIVERY",
  }),

  deliveryAddress: z
    .string()
    .min(10, "Delivery address must be at least 10 characters")
    .trim()
    .optional(),

  clientNotes: z
    .string()
    .max(500, "Notes must not exceed 500 characters")
    .trim()
    .optional(),
}).superRefine((data, ctx) => {
  if (data.fulfillmentMethod === "DELIVERY" && !data.deliveryAddress) {
    ctx.addIssue({
      path: ["deliveryAddress"],
      message: "Delivery address is required when delivery is selected",
      code: z.ZodIssueCode.custom,
    });
  }
});

import { z } from "zod";

// ─── Client places an order ────────────────────────────────────────────────

export const createOrderSchema = z
  .object({
    orderType: z.enum(["MODEL_1", "MODEL_2", "MODEL_3"], {
      required_error: "Order type is required",
    }),

    // Style selection (Model 1 & 2) — either a catalog style or a custom description
    styleId: z.string().cuid("Invalid style ID").optional(),

    customStyleDescription: z
      .string()
      .max(2000, "Description must not exceed 2000 characters")
      .trim()
      .optional(),

    // Ready-to-wear (Model 3 only) — An order can have multiple items
    items: z
      .array(
        z.object({
          readyToWearId: z.string().cuid("Invalid item ID"),
          selectedSize: z.string().max(20).trim(),
          quantity: z.number().int().min(1).default(1),
        }),
      )
      .optional(),

    // Model 1 specific
    clientProvidesFabric: z.coerce.boolean().optional(),
    fabricNotes: z
      .string()
      .max(1000, "Fabric notes must not exceed 1000 characters")
      .trim()
      .optional(),

    // Use client's saved measurements or not
    useSavedMeasurements: z.coerce.boolean().default(true),

    // Fulfillment
    fulfillmentMethod: z.enum(["PICKUP", "DELIVERY"], {
      required_error: "Fulfillment method is required",
    }),

    deliveryAddress: z.string().max(500).trim().optional(),

    clientNotes: z
      .string()
      .max(1000, "Notes must not exceed 1000 characters")
      .trim()
      .optional(),
  })
  .superRefine((data, ctx) => {
    // MODEL_3 must have an items array with at least one item
    if (data.orderType === "MODEL_3") {
      if (!data.items || data.items.length === 0) {
        ctx.addIssue({
          path: ["items"],
          message: "At least one item is required for Model 3 orders",
          code: z.ZodIssueCode.custom,
        });
      }
    }

    // MODEL_1 & MODEL_2 must have either styleId or customStyleDescription (not both)
    if (data.orderType === "MODEL_1" || data.orderType === "MODEL_2") {
      if (!data.styleId && !data.customStyleDescription) {
        ctx.addIssue({
          path: ["styleId"],
          message:
            "Either a style selection or custom style description is required",
          code: z.ZodIssueCode.custom,
        });
      }
      if (data.styleId && data.customStyleDescription) {
        ctx.addIssue({
          path: ["styleId"],
          message:
            "Provide either a style selection OR a custom description, not both",
          code: z.ZodIssueCode.custom,
        });
      }
    }

    // Delivery address required when fulfillment method is DELIVERY
    if (data.fulfillmentMethod === "DELIVERY" && !data.deliveryAddress) {
      ctx.addIssue({
        path: ["deliveryAddress"],
        message: "Delivery address is required when delivery is selected",
        code: z.ZodIssueCode.custom,
      });
    }
  });

// ─── Admin proposes a quote ────────────────────────────────────────────────

export const quoteOrderSchema = z.object({
  totalAgreedFee: z
    .number({ required_error: "Quote amount is required" })
    .positive("Quote must be a positive number"),

  adminNotes: z.string().max(1000).trim().optional(),
});

// ─── Client declines/negotiates quote ───────────────────────────────────────

export const declineQuoteSchema = z.object({
  negotiationNote: z
    .string()
    .max(500, "Note must not exceed 500 characters")
    .trim()
    .optional(),
});

// ─── Admin updates order status ────────────────────────────────────────────

export const updateStatusSchema = z.object({
  status: z.enum(
    [
      "PENDING_REVIEW",
      "AWAITING_CLIENT_RESPONSE",
      "AGREED_AWAITING_PAYMENT",
      "IN_PROGRESS",
      "CUTTING",
      "SEWING",
      "FINISHING",
      "AWAITING_FINAL_PAYMENT",
      "READY_FOR_PICKUP",
      "OUT_FOR_DELIVERY",
      "COMPLETED",
      "CANCELLED",
    ],
    { required_error: "Status is required" },
  ),

  note: z.string().max(500).trim().optional(),
  cancellationReason: z.string().max(500).trim().optional(),
});

// ─── Admin sets delivery fee ───────────────────────────────────────────────

export const deliveryFeeSchema = z.object({
  deliveryFee: z
    .number({ required_error: "Delivery fee is required" })
    .min(0, "Delivery fee cannot be negative"),

  deliveryAddress: z.string().max(500).trim().optional(),
});

// ─── Admin sets admin notes ───────────────────────────────────────────────

export const adminNotesSchema = z.object({
  adminNotes: z
    .string()
    .max(2000, "Admin notes must not exceed 2000 characters")
    .trim()
    .optional(),
});

// ─── Admin creates order on behalf of client ───────────────────────────────

export const adminCreateOrderSchema = createOrderSchema;
// Same validation — admin uses the same fields, just on behalf of someone else

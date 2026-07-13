import { z } from "zod";

// ─── Client submits payment proof ──────────────────────────────────────────

export const submitPaymentSchema = z.object({
  orderId: z
    .string({ error: "Order ID is required" })
    .cuid("Must be a valid order ID"),

  amount: z
    .coerce.number({ error: "Amount is required" })
    .positive("Amount must be greater than zero"),

  paymentType: z.enum(["INSTALLMENT", "FULL"], {
    error: "Payment type is required",
  }),

  notes: z.string().max(500).trim().optional(),
});

// Note: proof image is handled by multer (req.file), not Zod
// The controller checks req.file separately

// ─── Admin rejects a payment ───────────────────────────────────────────────

export const rejectPaymentSchema = z.object({
  rejectionReason: z
    .string({ error: "Rejection reason is required" })
    .min(5, "Please provide a meaningful rejection reason")
    .max(500)
    .trim(),
});

// ─── Admin logs offline payment ────────────────────────────────────────────

export const offlinePaymentSchema = z.object({
  orderId: z
    .string({ error: "Order ID is required" })
    .cuid("Must be a valid order ID"),

  amount: z
    .number({ error: "Amount is required" })
    .positive("Amount must be greater than zero"),

  paymentType: z.enum(["INSTALLMENT", "FULL"], {
    error: "Payment type is required",
  }),

  notes: z.string().max(500).trim().optional(),
  // e.g. "Cash payment received at studio on 15 March 2026"
});

// ─── Finance summary query params ──────────────────────────────────────────

export const financeSummarySchema = z.object({
  from: z.string().refine((v) => !isNaN(Date.parse(v)), { message: "Invalid from date" }).optional(),
  to: z.string().refine((v) => !isNaN(Date.parse(v)), { message: "Invalid to date" }).optional(),
  type: z.enum(["MODEL_1", "MODEL_2", "MODEL_3"]).optional(),
});

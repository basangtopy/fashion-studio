import { z } from "zod";

// All measurement fields — used in both create and update
// All are optional floats because not every measurement is needed for every garment
const measurementFields = {
  bust: z.number().positive("Must be a positive number").optional(),
  waist: z.number().positive("Must be a positive number").optional(),
  hips: z.number().positive("Must be a positive number").optional(),
  shoulderWidth: z.number().positive("Must be a positive number").optional(),
  sleeveLength: z.number().positive("Must be a positive number").optional(),
  dressLength: z.number().positive("Must be a positive number").optional(),
  thigh: z.number().positive("Must be a positive number").optional(),
  inseam: z.number().positive("Must be a positive number").optional(),
  neck: z.number().positive("Must be a positive number").optional(),
  armLength: z.number().positive("Must be a positive number").optional(),
  armCircumference: z.number().positive("Must be a positive number").optional(),
  ankleCircumference: z
    .number()
    .positive("Must be a positive number")
    .optional(),
  wristCircumference: z
    .number()
    .positive("Must be a positive number")
    .optional(),
  backLength: z.number().positive("Must be a positive number").optional(),
  frontLength: z.number().positive("Must be a positive number").optional(),
  customParams: z.record(z.number()).optional(),
  notes: z.string().max(500).optional(),
};

// Admin creating measurements for the first time — at least one measurement required
export const createMeasurementSchema = z
  .object({
    ...measurementFields,
  })
  .refine(
    (data) => {
      // Check that at least one actual measurement field is provided
      const measurementKeys = Object.keys(measurementFields).filter(
        (k) => k !== "notes" && k !== "customParams",
      );
      return measurementKeys.some((k) => data[k] !== undefined);
    },
    { message: "At least one measurement must be provided" },
  );

// Update schema — same fields, but client updates require disclaimerSigned
export const updateMeasurementSchema = z.object({
  ...measurementFields,
  disclaimerSigned: z.boolean().optional(),
});

// Appointment request schema
export const createAppointmentSchema = z.object({
  requestedDate: z.iso
    .datetime({ message: "Please provide a valid date and time" })
    .optional(),
  clientNotes: z
    .string()
    .max(500, "Notes must not exceed 500 characters")
    .optional(),
});

// Admin confirming/updating an appointment
export const updateAppointmentSchema = z.object({
  status: z.enum(["CONFIRMED", "COMPLETED", "CANCELLED"], {
    required_error: "Status is required",
  }),
  confirmedDate: z.string().datetime().optional(),
  adminNotes: z.string().max(500).optional(),
  cancelReason: z.string().max(500).optional(),
});

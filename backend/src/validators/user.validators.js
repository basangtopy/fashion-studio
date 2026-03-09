import { z } from "zod";

export const updateProfileSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(100)
      .trim()
      .optional(),

    phone: z
      .string()
      .regex(/^\+?[0-9]{10,15}$/, "Please provide a valid phone number")
      .trim()
      .optional(),

    sex: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),

    dateOfBirth: z
      .iso
      .date({ message: "Please provide a valid date" })
      .optional(),

    address: z
      .string()
      .min(5, "Please provide a complete address")
      .max(300)
      .trim()
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update",
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string({
      required_error: "Current password is required",
    }),

    newPassword: z
      .string({ required_error: "New password is required" })
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      ),

    confirmPassword: z.string({
      required_error: "Please confirm your new password",
    }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"], // tells Zod which field the error belongs to
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from your current password",
    path: ["newPassword"],
  });

export const updateProfilePictureSchema = z.object({});

export const createClientSchema = z.object({
  fullName: z
    .string({ required_error: "Full name is required" })
    .min(2)
    .max(100)
    .trim(),

  email: z
    .email("Please provide a valid email address")
    .toLowerCase()
    .trim(),

  phone: z
    .string({ required_error: "Phone number is required" })
    .regex(/^\+?[0-9]{10,15}$/, "Please provide a valid phone number"),

  sex: z.enum(["MALE", "FEMALE", "OTHER"], {
    required_error: "Sex is required",
  }),

  dateOfBirth: z.iso.date().optional(),
  address: z.string().min(5).max(300).trim().optional(),
});

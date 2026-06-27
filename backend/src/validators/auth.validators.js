import { z } from "zod";

export const registerSchema = z.object({
  fullName: z
    .string({ required_error: "Full name is required" })
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must not exceed 100 characters")
    .trim(),

  email: z.email("Please provide a valid email address").toLowerCase().trim(),

  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    ),

  phone: z
    .string({ required_error: "Phone number is required" })
    .regex(/^\+?[0-9]{10,15}$/, "Please provide a valid phone number")
    .trim(),

  sex: z.enum(["MALE", "FEMALE", "OTHER"], {
    required_error: "Sex is required",
    invalid_type_error: "Sex must be MALE, FEMALE, or OTHER",
  }),
});

export const loginSchema = z.object({
  email: z.email("Please provide a valid email address").toLowerCase().trim(),

  password: z.string({ required_error: "Password is required" }),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Please provide a valid email address").toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  token: z.string({ required_error: "Reset token is required" }),

  newPassword: z
    .string({ required_error: "New password is required" })
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    ),
});

export const verifyEmailSchema = z.object({
  token: z.string({ required_error: "Verification token is required" }),
});

export const oauthCodeExchangeSchema = z.object({
  code: z.string({ required_error: "Code is required" })
    .regex(/^[0-9a-fA-F]{48}$/, "Invalid code format"),
});

import { z } from "zod";

export const registerSchema = z.object({
  fullName: z
    .string({ error: "Full name is required" })
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must not exceed 100 characters")
    .trim(),

  email: z.email("Please provide a valid email address").toLowerCase().trim(),

  password: z
    .string({ error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    ),

  phone: z
    .string({ error: "Phone number is required" })
    .regex(/^\+?[0-9]{10,15}$/, "Please provide a valid phone number")
    .trim(),

  sex: z.enum(["MALE", "FEMALE", "OTHER"], {
    error: (issue) =>
      issue.input === undefined
        ? "Sex is required"
        : "Sex must be MALE, FEMALE, or OTHER",
  }),
});

export const loginSchema = z.object({
  email: z.email("Please provide a valid email address").toLowerCase().trim(),

  password: z.string({ error: "Password is required" }),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Please provide a valid email address").toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  token: z.string({ error: "Reset token is required" }),

  newPassword: z
    .string({ error: "New password is required" })
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    ),
});

export const verifyEmailSchema = z.object({
  token: z.string({ error: "Verification token is required" }),
});

export const oauthCodeExchangeSchema = z.object({
  code: z.string({ error: "Code is required" })
    .regex(/^[0-9a-fA-F]{48}$/, "Invalid code format"),
});

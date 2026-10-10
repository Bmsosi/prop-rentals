import { z } from "zod";

export const requestResetSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: "Email is required",
      })
      .email("Invalid email format")
      .min(1, "Email cannot be empty"),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z
      .string({
        required_error: "Reset token is required",
      })
      .min(1, "Token cannot be empty"),
    newPassword: z
      .string({
        required_error: "New password is required",
      })
      .min(6, "Password must be at least 6 characters long")
      .max(100, "Password must be less than 100 characters"),
  }),
});


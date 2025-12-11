import { z } from 'zod';

// Login validation schema
export const loginSchema = z.object({
  email: z.string()
    .trim()
    .email({ message: "Please enter a valid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  password: z.string()
    .min(1, { message: "Password is required" })
    .max(128, { message: "Password must be less than 128 characters" }),
});

// Player registration validation schema
export const playerRegisterSchema = z.object({
  username: z.string()
    .trim()
    .min(3, { message: "Username must be at least 3 characters" })
    .max(30, { message: "Username must be less than 30 characters" })
    .regex(/^[a-zA-Z0-9_-]+$/, { message: "Username can only contain letters, numbers, underscores, and hyphens" }),
  email: z.string()
    .trim()
    .email({ message: "Please enter a valid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  password: z.string()
    .min(6, { message: "Password must be at least 6 characters" })
    .max(128, { message: "Password must be less than 128 characters" }),
  confirmPassword: z.string(),
  phoneNumber: z.string()
    .trim()
    .min(10, { message: "Please enter a valid phone number" })
    .max(20, { message: "Phone number is too long" })
    .regex(/^[+]?[0-9\s-]+$/, { message: "Please enter a valid phone number" }),
  role: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Team registration validation schema
export const teamRegisterSchema = z.object({
  teamName: z.string()
    .trim()
    .min(2, { message: "Team name must be at least 2 characters" })
    .max(50, { message: "Team name must be less than 50 characters" }),
  email: z.string()
    .trim()
    .email({ message: "Please enter a valid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  password: z.string()
    .min(6, { message: "Password must be at least 6 characters" })
    .max(128, { message: "Password must be less than 128 characters" }),
  confirmPassword: z.string(),
  country: z.string()
    .max(100, { message: "Country name is too long" })
    .optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type PlayerRegisterFormData = z.infer<typeof playerRegisterSchema>;
export type TeamRegisterFormData = z.infer<typeof teamRegisterSchema>;

import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8)
});

export const signupSchema = z.object({
  schoolName: z.string().min(2).max(120),
  schoolSlug: z.string().min(3).max(60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(2).max(120),
  email: z.string().email().toLowerCase(),
  phone: z.string().min(8).max(20),
  password: z.string().min(8).max(100)
});

export const refreshSchema = z.object({
  refreshToken: z.string().optional()
});

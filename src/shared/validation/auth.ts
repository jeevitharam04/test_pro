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

export const forgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase()
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32),
  password: z.string().min(8).max(100)
});

export const invitationSchema = z.object({
  email: z.string().email().toLowerCase(),
  name: z.string().min(2).max(120),
  phone: z.string().min(8).max(20).optional(),
  role: z.enum(["TEACHER", "PARENT", "STUDENT"]),
  classId: z.string().uuid().optional(),
  studentId: z.string().uuid().optional()
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(32),
  password: z.string().min(8).max(100)
});

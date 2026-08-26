import { z } from "zod";

export const createClassSchema = z.object({
  name: z.string().min(1).max(80),
  section: z.string().min(1).max(20),
  capacity: z.coerce.number().int().min(1).max(200).default(40),
  classTeacherId: z.string().uuid().optional()
});

export const updateClassSchema = createClassSchema.partial();

export const createSubjectSchema = z.object({
  classId: z.string().uuid(),
  teacherId: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  code: z.string().min(1).max(40).toUpperCase()
});

export const updateSubjectSchema = createSubjectSchema.omit({ classId: true }).partial();

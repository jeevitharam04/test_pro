import { AttendanceMode, AttendanceStatus, HomeworkStatus } from "@prisma/client";
import { z } from "zod";

export const createStudentSchema = z.object({
  classId: z.string().uuid(),
  admissionNo: z.string().min(1).max(40).optional(),
  rollNo: z.string().max(20).optional(),
  name: z.string().min(2).max(120),
  email: z.string().email().toLowerCase().optional(),
  dateOfBirth: z.coerce.date().optional(),
  bloodGroup: z.string().max(10).optional(),
  parent: z
    .object({
      name: z.string().min(2).max(120),
      email: z.string().email().toLowerCase(),
      phone: z.string().min(8).max(20).optional(),
      relationship: z.string().min(2).max(40).default("guardian")
    })
    .optional()
});

export const updateStudentSchema = createStudentSchema.omit({ parent: true }).partial();

export const bulkAttendanceSchema = z.object({
  classId: z.string().uuid(),
  subjectId: z.string().uuid().optional(),
  mode: z.enum([AttendanceMode.DAILY, AttendanceMode.SUBJECT_WISE, AttendanceMode.SESSION_WISE]),
  session: z.string().max(40).optional(),
  markedOn: z.coerce.date(),
  records: z.array(
    z.object({
      studentId: z.string().uuid(),
      status: z.enum([AttendanceStatus.PRESENT, AttendanceStatus.ABSENT, AttendanceStatus.LEAVE]),
      note: z.string().max(240).optional()
    })
  )
});

export const createExamTypeSchema = z.object({
  name: z.string().min(1).max(80),
  maxMarks: z.coerce.number().int().min(1).max(1000),
  weightage: z.coerce.number().min(0).max(100).optional()
});

export const upsertMarksSchema = z.object({
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
  examTypeId: z.string().uuid(),
  records: z.array(
    z.object({
      studentId: z.string().uuid(),
      marks: z.coerce.number().min(0),
      remarks: z.string().max(240).optional()
    })
  )
});

export const createHomeworkSchema = z.object({
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
  title: z.string().min(2).max(160),
  description: z.string().min(1).max(4000),
  attachmentUrl: z.string().url().optional(),
  deadline: z.coerce.date()
});

export const homeworkSubmissionSchema = z.object({
  studentId: z.string().uuid(),
  status: z.enum([HomeworkStatus.SUBMITTED, HomeworkStatus.GRADED]).default(HomeworkStatus.SUBMITTED),
  answerUrl: z.string().url().optional(),
  grade: z.string().max(40).optional(),
  feedback: z.string().max(1000).optional()
});

export const createFeeStructureSchema = z.object({
  name: z.string().min(2).max(120),
  classId: z.string().uuid().optional(),
  amount: z.coerce.number().min(0),
  dueDate: z.coerce.date(),
  lateFee: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0)
});

export const createPaymentOrderSchema = z.object({
  feeStructureId: z.string().uuid(),
  studentId: z.string().uuid(),
  amount: z.coerce.number().min(1)
});

export const createAnnouncementSchema = z.object({
  classId: z.string().uuid().optional(),
  title: z.string().min(2).max(160),
  body: z.string().min(1).max(5000),
  attachmentUrl: z.string().url().optional(),
  category: z.enum(["ACADEMIC", "EXAMINATION", "FEES", "EVENTS", "PLACEMENTS", "HOLIDAYS", "GENERAL", "EMERGENCY"]).default("GENERAL"),
  priority: z.enum(["HIGH", "MEDIUM", "NORMAL"]).default("NORMAL"),
  audience: z.enum(["EVERYONE", "STUDENTS", "TEACHERS", "PARENTS"]).default("EVERYONE"),
  publishAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional()
});

export const createTimetableEntrySchema = z.object({
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
  teacherId: z.string().uuid(),
  dayOfWeek: z.coerce.number().int().min(1).max(7),
  startsAt: z.string().min(4).max(8),
  endsAt: z.string().min(4).max(8),
  room: z.string().max(40).optional()
});

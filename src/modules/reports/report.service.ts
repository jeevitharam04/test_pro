import { prisma } from "@/infrastructure/prisma/client";
import { calculateAttendancePercentage } from "@/modules/attendance/attendance.service";

export async function getStudentProgressReport(schoolId: string, studentId: string) {
  const [student, attendance, marks, homework, payments] = await Promise.all([
    prisma.student.findFirst({
      where: { id: studentId, schoolId, deletedAt: null },
      include: { user: { select: { name: true, email: true } }, class: true }
    }),
    prisma.attendance.findMany({ where: { studentId, schoolId, deletedAt: null } }),
    prisma.mark.findMany({
      where: { studentId, schoolId, deletedAt: null },
      include: { subject: true, examType: true }
    }),
    prisma.homeworkSubmission.findMany({
      where: { studentId, schoolId, deletedAt: null },
      include: { homework: true }
    }),
    prisma.payment.findMany({
      where: { studentId, schoolId, deletedAt: null },
      include: { feeStructure: true }
    })
  ]);

  return {
    student,
    attendancePercentage: calculateAttendancePercentage(attendance),
    marks,
    homework,
    payments
  };
}

export async function getSchoolSummaryReport(schoolId: string) {
  const [students, teachers, classes, payments, attendance] = await Promise.all([
    prisma.student.count({ where: { schoolId, deletedAt: null } }),
    prisma.teacher.count({ where: { schoolId, deletedAt: null } }),
    prisma.class.count({ where: { schoolId, deletedAt: null } }),
    prisma.payment.groupBy({ by: ["status"], where: { schoolId, deletedAt: null }, _sum: { amount: true } }),
    prisma.attendance.findMany({ where: { schoolId, deletedAt: null }, select: { status: true } })
  ]);

  return {
    students,
    teachers,
    classes,
    attendancePercentage: calculateAttendancePercentage(attendance),
    payments
  };
}

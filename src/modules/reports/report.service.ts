import { prisma } from "@/infrastructure/prisma/client";
import { calculateAttendancePercentage } from "@/modules/attendance/attendance.service";

export async function getStudentProgressReport(schoolId: string, studentId: string) {
  const [school, student, attendance, marks, homework, payments] = await Promise.all([
    prisma.school.findFirst({
      where: { id: schoolId, deletedAt: null },
      select: { presentAdditionPercent: true, absentDeductionPercent: true, leavePercentChange: true }
    }),
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
    attendancePercentage: calculateAttendancePercentage(attendance, school ? toAttendanceConfig(school) : undefined),
    marks,
    homework,
    payments
  };
}

export async function getSchoolSummaryReport(schoolId: string) {
  const [school, students, teachers, classes, payments, attendance] = await Promise.all([
    prisma.school.findFirst({
      where: { id: schoolId, deletedAt: null },
      select: { presentAdditionPercent: true, absentDeductionPercent: true, leavePercentChange: true }
    }),
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
    attendancePercentage: calculateAttendancePercentage(attendance, school ? toAttendanceConfig(school) : undefined),
    payments
  };
}

export async function exportSchoolReport(schoolId: string, type: "marks" | "attendance") {
  if (type === "attendance") {
    const records = await prisma.attendance.findMany({
      where: { schoolId, deletedAt: null },
      include: { student: { include: { user: { select: { name: true, email: true } }, class: { select: { name: true, section: true } } } }, subject: { select: { name: true, code: true } } },
      orderBy: { markedOn: "desc" }
    });

    return toCsv(
      ["Student", "Email", "Class", "Section", "Subject", "Date", "Mode", "Session", "Status", "Note"],
      records.map((record) => [
        record.student.user?.name ?? "",
        record.student.user?.email ?? "",
        record.student.class.name,
        record.student.class.section,
        record.subject?.name ?? "Daily",
        record.markedOn.toISOString().slice(0, 10),
        record.mode,
        record.session ?? "",
        record.status,
        record.note ?? ""
      ])
    );
  }

  const records = await prisma.mark.findMany({
    where: { schoolId, deletedAt: null },
    include: { student: { include: { user: { select: { name: true, email: true } }, class: { select: { name: true, section: true } } } }, subject: { select: { name: true, code: true } }, examType: { select: { name: true, maxMarks: true } } },
    orderBy: { updatedAt: "desc" }
  });

  return toCsv(
    ["Student", "Email", "Class", "Section", "Subject", "Exam", "Max Marks", "Marks", "Percentage", "Grade", "Remarks"],
    records.map((record) => [
      record.student.user?.name ?? "",
      record.student.user?.email ?? "",
      record.student.class.name,
      record.student.class.section,
      record.subject.name,
      record.examType.name,
      record.examType.maxMarks,
      record.marks.toString(),
      record.percentage.toString(),
      record.grade,
      record.remarks ?? ""
    ])
  );
}

function toCsv(headers: string[], rows: Array<Array<string | number>>) {
  return [headers, ...rows]
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\r\n");
}

function toAttendanceConfig(school: {
  presentAdditionPercent: { toNumber(): number };
  absentDeductionPercent: { toNumber(): number };
  leavePercentChange: { toNumber(): number };
}) {
  return {
    presentAdditionPercent: school.presentAdditionPercent.toNumber(),
    absentDeductionPercent: school.absentDeductionPercent.toNumber(),
    leavePercentChange: school.leavePercentChange.toNumber()
  };
}

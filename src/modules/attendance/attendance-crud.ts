import { prisma } from "@/infrastructure/prisma/client";
import { UserRole } from "@prisma/client";
import { enqueueNotification } from "@/infrastructure/queues/notifications";

export async function markBulkAttendance(
  schoolId: string,
  actorUserId: string,
  actorRole: UserRole,
  input: {
    classId: string;
    subjectId?: string;
    mode: "DAILY" | "SUBJECT_WISE" | "SESSION_WISE";
    session?: string;
    markedOn: Date;
    records: Array<{ studentId: string; status: "PRESENT" | "ABSENT" | "LEAVE"; note?: string }>;
  }
) {
  const classRecord = await prisma.class.findFirst({ where: { id: input.classId, schoolId, deletedAt: null } });
  if (!classRecord) throw new Error("Class does not belong to this school");
  if (actorRole === UserRole.TEACHER) {
    const teacher = await prisma.teacher.findFirst({ where: { userId: actorUserId, schoolId, deletedAt: null } });
    if (!teacher || classRecord.classTeacherId !== teacher.id) throw new Error("Teacher is not assigned to this class");
  }
  if (input.subjectId) {
    const subject = await prisma.subject.findFirst({ where: { id: input.subjectId, schoolId, classId: input.classId, deletedAt: null } });
    if (!subject) throw new Error("Subject does not belong to this class");
  }
  const studentIds = input.records.map((record) => record.studentId);
  const students = await prisma.student.findMany({ where: { id: { in: studentIds }, schoolId, classId: input.classId, deletedAt: null }, select: { id: true } });
  if (students.length !== new Set(studentIds).size) throw new Error("All students must belong to this class");

  const records = await prisma.$transaction(async (tx) => {
    const saved = [];
    for (const record of input.records) {
      const existing = await tx.attendance.findFirst({ where: { schoolId, studentId: record.studentId, subjectId: input.subjectId, session: input.session ?? "", markedOn: input.markedOn, deletedAt: null } });
      if (existing) {
        saved.push(await tx.attendance.update({ where: { id: existing.id }, data: { status: record.status, note: record.note, markedById: actorUserId } }));
      } else {
        saved.push(await tx.attendance.create({ data: { schoolId, classId: input.classId, studentId: record.studentId, subjectId: input.subjectId, mode: input.mode, session: input.session ?? "", markedOn: input.markedOn, status: record.status, note: record.note, markedById: actorUserId } }));
      }
    }
    return saved;
  });

  const absentStudentIds = input.records.filter((record) => record.status === "ABSENT").map((record) => record.studentId);
  if (absentStudentIds.length > 0) {
    const absentStudents = await prisma.student.findMany({ where: { id: { in: absentStudentIds }, schoolId, deletedAt: null }, include: { user: { select: { name: true } }, parents: { include: { parent: { include: { user: { select: { phone: true } } } } } } } });
    await Promise.all(absentStudents.flatMap((student) => student.parents.flatMap((link) => {
      const phone = link.parent.user.phone;
      if (!phone) return [];
      return enqueueNotification({ schoolId, userId: link.parent.userId, channel: "SMS", to: phone, title: "Attendance alert", body: `${student.user?.name ?? "Your child"} was marked absent on ${input.markedOn.toLocaleDateString()}.` });
    })));
  }
  return records;
}

export function listAttendance(schoolId: string, filters: { classId?: string; studentId?: string }) {
  return prisma.attendance.findMany({ where: { schoolId, classId: filters.classId, studentId: filters.studentId, deletedAt: null }, include: { student: { include: { user: { select: { name: true } } } }, subject: { select: { name: true, code: true } } }, orderBy: { markedOn: "desc" }, take: 200 });
}
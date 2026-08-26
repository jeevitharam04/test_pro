import { prisma } from "@/infrastructure/prisma/client";

export async function markBulkAttendance(
  schoolId: string,
  actorUserId: string,
  input: {
    classId: string;
    subjectId?: string;
    mode: "DAILY" | "SUBJECT_WISE" | "SESSION_WISE";
    session?: string;
    markedOn: Date;
    records: Array<{ studentId: string; status: "PRESENT" | "ABSENT" | "LEAVE"; note?: string }>;
  }
) {
  const records = await prisma.$transaction(async (tx) => {
    const saved = [];

    for (const record of input.records) {
      const existing = await tx.attendance.findFirst({
        where: {
          schoolId,
          studentId: record.studentId,
          subjectId: input.subjectId,
          session: input.session ?? "",
          markedOn: input.markedOn,
          deletedAt: null
        }
      });

      if (existing) {
        saved.push(
          await tx.attendance.update({
            where: { id: existing.id },
            data: {
              status: record.status,
              note: record.note,
              markedById: actorUserId
            }
          })
        );
        continue;
      }

      saved.push(
        await tx.attendance.create({
          data: {
            schoolId,
            classId: input.classId,
            studentId: record.studentId,
            subjectId: input.subjectId,
            mode: input.mode,
            session: input.session ?? "",
            markedOn: input.markedOn,
            status: record.status,
            note: record.note,
            markedById: actorUserId
          }
        })
      );
    }

    return saved;
  });

  return records;
}

export function listAttendance(schoolId: string, filters: { classId?: string; studentId?: string }) {
  return prisma.attendance.findMany({
    where: { schoolId, classId: filters.classId, studentId: filters.studentId, deletedAt: null },
    include: {
      student: { include: { user: { select: { name: true } } } },
      subject: { select: { name: true, code: true } }
    },
    orderBy: { markedOn: "desc" },
    take: 200
  });
}

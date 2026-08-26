import { prisma } from "@/infrastructure/prisma/client";

export function createTimetableEntry(
  schoolId: string,
  input: {
    classId: string;
    subjectId: string;
    teacherId: string;
    dayOfWeek: number;
    startsAt: string;
    endsAt: string;
    room?: string;
  }
) {
  return prisma.timetableEntry.create({ data: { schoolId, ...input } });
}

export function listTimetable(schoolId: string, filters: { classId?: string; teacherId?: string }) {
  return prisma.timetableEntry.findMany({
    where: { schoolId, classId: filters.classId, teacherId: filters.teacherId, deletedAt: null },
    include: {
      class: { select: { name: true, section: true } },
      subject: { select: { name: true } },
      teacher: { include: { user: { select: { name: true } } } }
    },
    orderBy: [{ dayOfWeek: "asc" }, { startsAt: "asc" }]
  });
}

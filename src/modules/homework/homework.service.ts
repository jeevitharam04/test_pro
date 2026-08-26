import { prisma } from "@/infrastructure/prisma/client";

export async function createHomework(
  schoolId: string,
  actorUserId: string,
  input: { classId: string; subjectId: string; title: string; description: string; attachmentUrl?: string; deadline: Date }
) {
  const teacher = await prisma.teacher.findFirst({ where: { userId: actorUserId, schoolId } });
  if (!teacher) throw new Error("Teacher profile required to create homework");

  return prisma.homework.create({
    data: { schoolId, teacherId: teacher.id, ...input }
  });
}

export function listHomework(schoolId: string, classId?: string) {
  return prisma.homework.findMany({
    where: { schoolId, classId, deletedAt: null },
    include: {
      class: { select: { name: true, section: true } },
      subject: { select: { name: true } },
      teacher: { include: { user: { select: { name: true } } } },
      _count: { select: { submissions: true } }
    },
    orderBy: { deadline: "asc" }
  });
}

export function submitHomework(
  schoolId: string,
  homeworkId: string,
  input: { studentId: string; status: "SUBMITTED" | "GRADED"; answerUrl?: string; grade?: string; feedback?: string }
) {
  return prisma.homeworkSubmission.upsert({
    where: { homeworkId_studentId: { homeworkId, studentId: input.studentId } },
    update: { ...input, submittedAt: input.status === "SUBMITTED" ? new Date() : undefined },
    create: { schoolId, homeworkId, ...input, submittedAt: new Date() }
  });
}

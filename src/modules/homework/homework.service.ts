import { prisma } from "@/infrastructure/prisma/client";

export async function createHomework(
  schoolId: string,
  actorUserId: string,
  input: { classId: string; subjectId: string; title: string; description: string; attachmentUrl?: string; deadline: Date }
) {
  const teacher = await prisma.teacher.findFirst({ where: { userId: actorUserId, schoolId } });
  if (!teacher) throw new Error("Teacher profile required to create homework");

  const [classRecord, subject] = await Promise.all([
    prisma.class.findFirst({ where: { id: input.classId, schoolId, deletedAt: null } }),
    prisma.subject.findFirst({ where: { id: input.subjectId, schoolId, classId: input.classId, teacherId: teacher.id, deletedAt: null } })
  ]);
  if (!classRecord || !subject) throw new Error("Homework class or subject is not assigned to this teacher");

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

export async function submitHomework(
  schoolId: string,
  homeworkId: string,
  actorUserId: string,
  input: { studentId: string; status: "SUBMITTED" | "GRADED"; answerUrl?: string; grade?: string; feedback?: string }
) {
  const homework = await prisma.homework.findFirst({ where: { id: homeworkId, schoolId, deletedAt: null } });
  const student = await prisma.student.findFirst({ where: { id: input.studentId, schoolId, classId: homework?.classId, deletedAt: null }, include: { user: true, parents: true } });
  if (!homework || !student) throw new Error("Homework or student does not belong to this school");

  const actor = await prisma.user.findFirst({ where: { id: actorUserId, schoolId, deletedAt: null }, include: { student: true, parent: { include: { students: true } } } });
  const isStudent = actor?.student?.id === student.id;
  const isParent = actor?.parent?.students.some((link) => link.studentId === student.id) ?? false;
  const isTeacher = actor?.role === "TEACHER" && homework.teacherId === (await prisma.teacher.findFirst({ where: { userId: actorUserId, schoolId } }))?.id;
  if (!isStudent && !isParent && !isTeacher) throw new Error("You cannot submit homework for this student");

  return prisma.homeworkSubmission.upsert({
    where: { homeworkId_studentId: { homeworkId, studentId: input.studentId } },
    update: { ...input, submittedAt: input.status === "SUBMITTED" ? new Date() : undefined },
    create: { schoolId, homeworkId, ...input, submittedAt: new Date() }
  });
}

import { prisma } from "@/infrastructure/prisma/client";

export function listSubjects(schoolId: string, classId?: string) {
  return prisma.subject.findMany({
    where: { schoolId, classId, deletedAt: null },
    include: {
      class: {
        select: { id: true, name: true, section: true }
      },
      teacher: {
        select: {
          id: true,
          employeeCode: true,
          user: {
            select: { name: true, email: true }
          }
        }
      }
    },
    orderBy: [{ class: { name: "asc" } }, { name: "asc" }]
  });
}

export function getSubjectById(schoolId: string, id: string) {
  return prisma.subject.findFirst({
    where: { id, schoolId, deletedAt: null },
    include: {
      class: {
        select: { id: true, name: true, section: true }
      },
      teacher: {
        select: {
          id: true,
          employeeCode: true,
          user: {
            select: { name: true, email: true }
          }
        }
      }
    }
  });
}

export async function createSubject(
  schoolId: string,
  input: {
    classId: string;
    teacherId?: string;
    name: string;
    code: string;
  },
  actorUserId: string
) {
  const classRecord = await prisma.class.findFirst({
    where: { id: input.classId, schoolId, deletedAt: null },
    select: { id: true }
  });

  if (!classRecord) {
    throw new Error("Class not found for this school");
  }

  const created = await prisma.subject.create({
    data: {
      schoolId,
      classId: input.classId,
      teacherId: input.teacherId,
      name: input.name,
      code: input.code
    }
  });

  await prisma.auditLog.create({
    data: {
      schoolId,
      actorUserId,
      action: "subject.created",
      entity: "Subject",
      entityId: created.id,
      metadata: { name: created.name, code: created.code }
    }
  });

  return created;
}

export function updateSubject(
  schoolId: string,
  id: string,
  input: {
    teacherId?: string;
    name?: string;
    code?: string;
  }
) {
  return prisma.subject.update({
    where: { id, schoolId },
    data: input
  });
}

export function deleteSubject(schoolId: string, id: string) {
  return prisma.subject.update({
    where: { id, schoolId },
    data: { deletedAt: new Date() }
  });
}

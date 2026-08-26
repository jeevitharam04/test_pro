import { prisma } from "@/infrastructure/prisma/client";

export function listClasses(schoolId: string) {
  return prisma.class.findMany({
    where: { schoolId, deletedAt: null },
    include: {
      classTeacher: {
        select: {
          id: true,
          employeeCode: true,
          user: {
            select: { name: true, email: true }
          }
        }
      },
      _count: {
        select: {
          students: true,
          subjects: true
        }
      }
    },
    orderBy: [{ name: "asc" }, { section: "asc" }]
  });
}

export function getClassById(schoolId: string, id: string) {
  return prisma.class.findFirst({
    where: { id, schoolId, deletedAt: null },
    include: {
      subjects: {
        where: { deletedAt: null },
        orderBy: { name: "asc" }
      },
      students: {
        where: { deletedAt: null },
        select: {
          id: true,
          admissionNo: true,
          rollNo: true,
          user: {
            select: { name: true, email: true }
          }
        },
        orderBy: { rollNo: "asc" }
      }
    }
  });
}

export async function createClass(
  schoolId: string,
  input: {
    name: string;
    section: string;
    capacity: number;
    classTeacherId?: string;
  },
  actorUserId: string
) {
  const created = await prisma.class.create({
    data: {
      schoolId,
      name: input.name,
      section: input.section,
      capacity: input.capacity,
      classTeacherId: input.classTeacherId
    }
  });

  await prisma.auditLog.create({
    data: {
      schoolId,
      actorUserId,
      action: "class.created",
      entity: "Class",
      entityId: created.id,
      metadata: { name: created.name, section: created.section }
    }
  });

  return created;
}

export function updateClass(
  schoolId: string,
  id: string,
  input: {
    name?: string;
    section?: string;
    capacity?: number;
    classTeacherId?: string;
  }
) {
  return prisma.class.update({
    where: { id, schoolId },
    data: input
  });
}

export function deleteClass(schoolId: string, id: string) {
  return prisma.class.update({
    where: { id, schoolId },
    data: { deletedAt: new Date() }
  });
}

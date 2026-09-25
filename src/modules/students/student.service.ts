import { UserRole } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { prisma } from "@/infrastructure/prisma/client";
import { ensureSchoolCanAddUser } from "@/modules/schools/subscription.service";
import { hashPassword } from "@/shared/auth/password";

const defaultPassword = "Password@123";

export function listStudents(schoolId: string, classId?: string) {
  return prisma.student.findMany({
    where: { schoolId, classId, deletedAt: null },
    include: {
      class: { select: { name: true, section: true } },
      user: { select: { name: true, email: true } },
      parents: {
        include: {
          parent: { include: { user: { select: { name: true, email: true, phone: true } } } }
        }
      }
    },
    orderBy: [{ class: { name: "asc" } }, { rollNo: "asc" }]
  });
}

export async function createStudent(
  schoolId: string,
  input: {
    classId: string;
    admissionNo?: string;
    rollNo?: string;
    name: string;
    email?: string;
    dateOfBirth?: Date;
    bloodGroup?: string;
    parent?: { name: string; email: string; phone?: string; relationship: string };
  },
  actorUserId: string
) {
  await ensureSchoolCanAddUser(schoolId, UserRole.STUDENT);

  return prisma.$transaction(async (tx) => {
    const studentUser = input.email
      ? await tx.user.create({
          data: {
            schoolId,
            email: input.email,
            name: input.name,
            role: UserRole.STUDENT,
            passwordHash: await hashPassword(defaultPassword)
          }
        })
      : null;

    const admissionNo = input.admissionNo ?? await allocateAdmissionNo(tx, schoolId);
    const rollNo = input.rollNo ?? await allocateRollNo(tx, schoolId, input.classId);
    const student = await tx.student.create({
      data: {
        schoolId,
        classId: input.classId,
        userId: studentUser?.id,
        admissionNo,
        rollNo,
        dateOfBirth: input.dateOfBirth,
        bloodGroup: input.bloodGroup
      }
    });

    if (input.parent) {
      const parentUser = await tx.user.upsert({
        where: { email: input.parent.email },
        update: {
          name: input.parent.name,
          phone: input.parent.phone
        },
        create: {
          schoolId,
          email: input.parent.email,
          name: input.parent.name,
          phone: input.parent.phone,
          role: UserRole.PARENT,
          passwordHash: await hashPassword(defaultPassword)
        }
      });

      const parent = await tx.parent.upsert({
        where: { userId: parentUser.id },
        update: { relationship: input.parent.relationship },
        create: {
          schoolId,
          userId: parentUser.id,
          relationship: input.parent.relationship
        }
      });

      await tx.parentStudent.create({
        data: { schoolId, parentId: parent.id, studentId: student.id }
      });
    }

    await tx.auditLog.create({
      data: {
        schoolId,
        actorUserId,
        action: "student.created",
        entity: "Student",
        entityId: student.id
      }
    });

    return student;
  });
}

async function allocateAdmissionNo(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0], schoolId: string) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = `ADM-${new Date().getFullYear()}-${randomBytes(3).toString("hex").toUpperCase()}`;
    const existing = await tx.student.findFirst({ where: { schoolId, admissionNo: candidate } });
    if (!existing) return candidate;
  }
  throw new Error("Unable to allocate a unique admission ID");
}

async function allocateRollNo(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  schoolId: string,
  classId: string
) {
  const students = await tx.student.findMany({ where: { schoolId, classId, deletedAt: null }, select: { rollNo: true } });
  const highestRoll = students.reduce((highest, student) => Math.max(highest, Number(student.rollNo) || 0), 0);
  return String(highestRoll + 1).padStart(2, "0");
}

export async function updateStudent(
  schoolId: string,
  id: string,
  data: {
    classId?: string;
    admissionNo?: string;
    rollNo?: string;
    dateOfBirth?: Date;
    bloodGroup?: string;
    name?: string;
    email?: string;
  }
) {
  const student = await prisma.student.update({
    where: { id, schoolId },
    data: {
      classId: data.classId,
      admissionNo: data.admissionNo,
      rollNo: data.rollNo,
      dateOfBirth: data.dateOfBirth,
      bloodGroup: data.bloodGroup
    }
  });

  if (student.userId && (data.name || data.email)) {
    await prisma.user.update({
      where: { id: student.userId },
      data: {
        name: data.name,
        email: data.email
      }
    });
  }

  return student;
}

export function deleteStudent(schoolId: string, id: string) {
  return prisma.student.update({ where: { id, schoolId }, data: { deletedAt: new Date() } });
}

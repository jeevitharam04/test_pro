import { UserRole } from "@prisma/client";
import { randomBytes } from "crypto";
import { prisma } from "@/infrastructure/prisma/client";
import { enqueueNotification } from "@/infrastructure/queues/notifications";
import { hashPassword } from "@/shared/auth/password";
import { hashToken } from "@/shared/auth/tokens";
import { ensureSchoolCanAddUser } from "@/modules/schools/subscription.service";

const invitationDays = 7;

export async function createInvitation(input: {
  schoolId: string;
  createdByUserId: string;
  email: string;
  name: string;
  phone?: string;
  role: Extract<UserRole, "TEACHER" | "PARENT" | "STUDENT">;
  classId?: string;
  studentId?: string;
}) {
  if (input.role === UserRole.STUDENT && !input.classId) {
    throw new Error("A class is required for student invitations");
  }

  const existingUser = await prisma.user.findUnique({ where: { email: input.email } });
  if (existingUser) throw new Error("This email is already registered");

  await ensureSchoolCanAddUser(input.schoolId, input.role);

  if (input.classId) {
    const classRecord = await prisma.class.findFirst({ where: { id: input.classId, schoolId: input.schoolId, deletedAt: null } });
    if (!classRecord) throw new Error("Class does not belong to this school");
  }

  if (input.studentId) {
    const student = await prisma.student.findFirst({ where: { id: input.studentId, schoolId: input.schoolId, deletedAt: null } });
    if (!student) throw new Error("Student does not belong to this school");
  }

  const token = randomBytes(32).toString("hex");
  const invitation = await prisma.invitation.create({
    data: {
      schoolId: input.schoolId,
      createdByUserId: input.createdByUserId,
      email: input.email,
      name: input.name,
      phone: input.phone,
      role: input.role,
      classId: input.classId,
      studentId: input.studentId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + invitationDays * 24 * 60 * 60 * 1000)
    }
  });

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  await enqueueNotification({
    schoolId: input.schoolId,
    userId: input.createdByUserId,
    channel: "EMAIL",
    to: input.email,
    title: "You are invited to EduCare",
    body: [
      `Hello ${input.name},`,
      "",
      `Create your EduCare account here: ${appUrl}/signup?invite=${token}`,
      `This invitation expires in ${invitationDays} days.`,
      ""
    ].join("\n")
  });

  return { id: invitation.id, email: invitation.email, role: invitation.role, expiresAt: invitation.expiresAt, ...(process.env.NODE_ENV === "development" ? { token } : {}) };
}

export async function acceptInvitation(token: string, password: string) {
  const invitation = await prisma.invitation.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!invitation || invitation.acceptedAt || invitation.expiresAt <= new Date()) {
    throw new Error("Invalid or expired invitation");
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        schoolId: invitation.schoolId,
        email: invitation.email,
        name: invitation.name,
        phone: invitation.phone,
        role: invitation.role,
        passwordHash,
        emailVerifiedAt: new Date()
      }
    });

    if (invitation.role === UserRole.TEACHER) {
      const count = await tx.teacher.count({ where: { schoolId: invitation.schoolId } });
      await tx.teacher.create({ data: { schoolId: invitation.schoolId, userId: createdUser.id, employeeCode: `FAC-${String(count + 1).padStart(4, "0")}` } });
    } else if (invitation.role === UserRole.PARENT) {
      const parent = await tx.parent.create({ data: { schoolId: invitation.schoolId, userId: createdUser.id } });
      if (invitation.studentId) {
        await tx.parentStudent.create({ data: { schoolId: invitation.schoolId, parentId: parent.id, studentId: invitation.studentId } });
      }
    } else if (invitation.role === UserRole.STUDENT) {
      const studentCount = await tx.student.count({ where: { schoolId: invitation.schoolId } });
      await tx.student.create({
        data: {
          schoolId: invitation.schoolId,
          userId: createdUser.id,
          classId: invitation.classId!,
          admissionNo: `INV-${String(studentCount + 1).padStart(6, "0")}`
        }
      });
    }

    await tx.invitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } });
    return createdUser;
  });

  return user;
}

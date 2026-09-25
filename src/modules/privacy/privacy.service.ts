import { Prisma, PrivacyRequestStatus, PrivacyRequestType } from "@prisma/client";
import { prisma } from "@/infrastructure/prisma/client";

export function createPrivacyRequest(input: { schoolId: string; requesterId: string; type: PrivacyRequestType; note?: string }) {
  return prisma.privacyRequest.create({
    data: input,
    select: { id: true, type: true, status: true, note: true, createdAt: true }
  });
}

export function listPrivacyRequests(schoolId: string, requesterId?: string) {
  return prisma.privacyRequest.findMany({
    where: { schoolId, ...(requesterId ? { requesterId } : {}) },
    select: {
      id: true,
      type: true,
      status: true,
      note: true,
      createdAt: true,
      reviewedAt: true,
      requester: { select: { id: true, name: true, email: true, role: true } }
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function updatePrivacyRequest(input: { schoolId: string; requestId: string; reviewerId: string; status: PrivacyRequestStatus }) {
  const request = await prisma.privacyRequest.findFirst({ where: { id: input.requestId, schoolId: input.schoolId } });
  if (!request) throw new Error("Privacy request not found");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.privacyRequest.update({
      where: { id: request.id },
      data: { status: input.status, reviewedById: input.reviewerId, reviewedAt: new Date() },
      select: { id: true, type: true, status: true, reviewedAt: true }
    });

    if (request.type === PrivacyRequestType.DELETION && input.status === PrivacyRequestStatus.COMPLETED) {
      const requester = await tx.user.findFirst({ where: { id: request.requesterId, schoolId: input.schoolId, deletedAt: null }, select: { role: true } });
      if (requester) {
        const anonymousEmail = `deleted+${request.requesterId}@invalid.educare`;
        await tx.user.update({
          where: { id: request.requesterId },
          data: { email: anonymousEmail, name: "Deleted user", phone: null, passwordHash: "!deleted", emailVerifiedAt: null, deletedAt: new Date() }
        });
        await tx.refreshToken.updateMany({ where: { userId: request.requesterId, revokedAt: null }, data: { revokedAt: new Date() } });
        if (requester.role === "STUDENT") await tx.student.updateMany({ where: { userId: request.requesterId, schoolId: input.schoolId }, data: { deletedAt: new Date() } });
        if (requester.role === "TEACHER") await tx.teacher.updateMany({ where: { userId: request.requesterId, schoolId: input.schoolId }, data: { deletedAt: new Date() } });
        if (requester.role === "PARENT") await tx.parent.updateMany({ where: { userId: request.requesterId, schoolId: input.schoolId }, data: { deletedAt: new Date() } });
      }
    }

    await tx.auditLog.create({
      data: {
        schoolId: input.schoolId,
        actorUserId: input.reviewerId,
        action: "privacy.request.updated",
        entity: "PrivacyRequest",
        entityId: request.id,
        metadata: { status: input.status, dataAction: request.type === PrivacyRequestType.DELETION && input.status === PrivacyRequestStatus.COMPLETED ? "anonymized" : "none" } satisfies Prisma.InputJsonValue
      }
    });

    return updated;
  });
}

export async function exportUserData(userId: string, schoolId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, schoolId, deletedAt: null },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      emailVerifiedAt: true,
      createdAt: true,
      lastLoginAt: true,
      school: { select: { id: true, name: true, slug: true } }
    }
  });

  if (!user) {
    throw new Error("User data not found");
  }

  const profile = user.role === "STUDENT"
    ? await prisma.student.findFirst({
        where: { userId, schoolId, deletedAt: null },
        select: {
          admissionNo: true,
          rollNo: true,
          dateOfBirth: true,
          bloodGroup: true,
          class: { select: { name: true, section: true } },
          attendance: { where: { deletedAt: null }, select: { markedOn: true, status: true } },
          marks: { where: { deletedAt: null }, select: { marks: true, percentage: true, grade: true, remarks: true, subject: { select: { name: true, code: true } }, examType: { select: { name: true, maxMarks: true } } } }
        }
      })
    : user.role === "PARENT"
      ? await prisma.parent.findFirst({
          where: { userId, schoolId, deletedAt: null },
          select: {
            relationship: true,
            students: { select: { student: { select: { admissionNo: true, rollNo: true, class: { select: { name: true, section: true } } } } } }
          }
        })
      : user.role === "TEACHER"
        ? await prisma.teacher.findFirst({
            where: { userId, schoolId, deletedAt: null },
            select: { employeeCode: true, assignedClasses: { select: { name: true, section: true } }, subjects: { select: { name: true, code: true } } }
          })
        : null;

  return {
    exportedAt: new Date().toISOString(),
    user,
    profile
  };
}
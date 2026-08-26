import { prisma } from "@/infrastructure/prisma/client";

export function createAnnouncement(
  schoolId: string,
  authorUserId: string,
  input: { classId?: string; title: string; body: string; attachmentUrl?: string; category: string; priority: string; audience: string; publishAt?: Date; expiresAt?: Date }
) {
  return prisma.announcement.create({ data: { schoolId, authorUserId, ...input } });
}

export function listAnnouncements(schoolId: string, classId?: string) {
  return prisma.announcement.findMany({
    where: { schoolId, classId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 100
  });
}

import { prisma } from "@/infrastructure/prisma/client";

export function getSchoolOverview(schoolId: string) {
  return prisma.school.findFirst({
    where: { id: schoolId, deletedAt: null },
    select: {
      id: true,
      name: true,
      slug: true,
      subscriptionPlan: true,
      attendanceMode: true,
      presentAdditionPercent: true,
      absentDeductionPercent: true,
      leavePercentChange: true,
      _count: {
        select: {
          users: true,
          teachers: true,
          students: true,
          classes: true
        }
      }
    }
  });
}

export function updateSchoolSettings(
  schoolId: string,
  data: {
    name?: string;
    attendanceMode?: "DAILY" | "SUBJECT_WISE" | "SESSION_WISE";
    subscriptionPlan?: string;
    presentAdditionPercent?: number;
    absentDeductionPercent?: number;
    leavePercentChange?: number;
  }
) {
  return prisma.school.update({
    where: { id: schoolId },
    data
  });
}

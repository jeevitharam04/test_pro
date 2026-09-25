import { UserRole } from "@prisma/client";
import { prisma } from "@/infrastructure/prisma/client";

export type PlanName = "starter" | "growth" | "institution";

export const planCatalog: Record<PlanName, { monthlyPriceInr: number; label: string }> = {
  starter: { monthlyPriceInr: 2999, label: "Starter" },
  growth: { monthlyPriceInr: 5999, label: "Growth" },
  institution: { monthlyPriceInr: 12999, label: "Institution" }
};

export type PlanConfig = {
  name: PlanName;
  maxStudents: number;
  maxTeachers: number;
  maxStorageGb: number;
  monthlySms: number;
};

export function getPlanConfig(plan?: string | null): PlanConfig {
  const normalized = (plan ?? "starter").toLowerCase();

  switch (normalized) {
    case "growth":
      return {
        name: "growth",
        maxStudents: 800,
        maxTeachers: 50,
        maxStorageGb: 50,
        monthlySms: 500
      };
    case "institution":
      return {
        name: "institution",
        maxStudents: Number.POSITIVE_INFINITY,
        maxTeachers: Number.POSITIVE_INFINITY,
        maxStorageGb: 200,
        monthlySms: Number.POSITIVE_INFINITY
      };
    case "starter":
    default:
      return {
        name: "starter",
        maxStudents: 300,
        maxTeachers: 20,
        maxStorageGb: 10,
        monthlySms: 100
      };
  }
}

export function isPlanName(value: string): value is PlanName {
  return value === "starter" || value === "growth" || value === "institution";
}

export function hasCapacityForPlan(
  plan: string | null | undefined,
  counts: { students?: number; teachers?: number },
  kind: "STUDENT" | "TEACHER"
) {
  const config = getPlanConfig(plan);
  const count = kind === "STUDENT" ? Number(counts.students ?? 0) : Number(counts.teachers ?? 0);
  const maxAllowed = kind === "STUDENT" ? config.maxStudents : config.maxTeachers;

  if (!Number.isFinite(maxAllowed)) {
    return true;
  }

  return count < maxAllowed;
}

export async function ensureSchoolCanAddUser(schoolId: string, role: UserRole) {
  if (role !== UserRole.STUDENT && role !== UserRole.TEACHER) {
    return true;
  }

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { subscriptionPlan: true }
  });

  const plan = school?.subscriptionPlan ?? "starter";
  const counts = {
    students: await prisma.student.count({ where: { schoolId, deletedAt: null } }),
    teachers: await prisma.teacher.count({ where: { schoolId, deletedAt: null } })
  };

  if (role === UserRole.STUDENT && !hasCapacityForPlan(plan, counts, "STUDENT")) {
    const config = getPlanConfig(plan);
    throw new Error(
      `Student limit reached for the ${config.name} plan (${config.maxStudents} students). Upgrade your school plan to add more students.`
    );
  }

  if (role === UserRole.TEACHER && !hasCapacityForPlan(plan, counts, "TEACHER")) {
    const config = getPlanConfig(plan);
    throw new Error(
      `Teacher limit reached for the ${config.name} plan (${config.maxTeachers} teachers). Upgrade your school plan to add more teachers.`
    );
  }

  return true;
}

export async function getSubscriptionUsage(schoolId: string) {
  const [school, students, teachers, documents, smsThisMonth] = await Promise.all([
    prisma.school.findFirst({ where: { id: schoolId, deletedAt: null }, select: { subscriptionPlan: true } }),
    prisma.student.count({ where: { schoolId, deletedAt: null } }),
    prisma.teacher.count({ where: { schoolId, deletedAt: null } }),
    prisma.studentDocument.count({ where: { schoolId } }),
    prisma.notification.count({
      where: {
        schoolId,
        channel: "SMS",
        createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
      }
    })
  ]);

  const plan = getPlanConfig(school?.subscriptionPlan);
  return {
    plan: plan.name,
    limits: {
      students: plan.maxStudents,
      teachers: plan.maxTeachers,
      storageGb: plan.maxStorageGb,
      monthlySms: plan.monthlySms
    },
    usage: { students, teachers, documents, monthlySms: smsThisMonth },
    remaining: {
      students: remaining(plan.maxStudents, students),
      teachers: remaining(plan.maxTeachers, teachers),
      monthlySms: remaining(plan.monthlySms, smsThisMonth)
    }
  };
}

function remaining(limit: number, used: number) {
  return Number.isFinite(limit) ? Math.max(limit - used, 0) : null;
}

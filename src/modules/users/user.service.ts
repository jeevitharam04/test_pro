import { UserRole } from "@prisma/client";
import { prisma } from "@/infrastructure/prisma/client";
import { hashPassword } from "@/shared/auth/password";

export function listUsers(schoolId: string) {
  return prisma.user.findMany({
    where: { schoolId, deletedAt: null },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      lastLoginAt: true,
      createdAt: true
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function createSchoolUser(input: {
  schoolId: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  password: string;
}) {
  return prisma.user.create({
    data: {
      schoolId: input.schoolId,
      email: input.email,
      name: input.name,
      phone: input.phone,
      role: input.role,
      passwordHash: await hashPassword(input.password)
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true
    }
  });
}

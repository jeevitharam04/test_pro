import { UserRole } from "@prisma/client";
import { z } from "zod";
import { createSchoolUser, listUsers } from "@/modules/users/user.service";
import { getSession } from "@/shared/auth/session";
import { fail, handleApiError, ok, created } from "@/shared/http/responses";
import { assertPermission } from "@/shared/rbac/permissions";
import { prisma } from "@/infrastructure/prisma/client";

const createUserSchema = z.object({
  email: z.string().email().toLowerCase(),
  name: z.string().min(2).max(120),
  phone: z.string().min(8).max(20).optional(),
  role: z.enum([UserRole.PRINCIPAL, UserRole.TEACHER, UserRole.PARENT, UserRole.STUDENT]),
  password: z.string().min(8).max(100).default("Password@123"),
  employeeCode: z.string().max(40).optional()
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.schoolId) {
      return fail("Unauthenticated", 401);
    }

    assertPermission(session.role, "users", "read");
    return ok(await listUsers(session.schoolId));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.schoolId) {
      return fail("Unauthenticated", 401);
    }

    assertPermission(session.role, "users", "manage");
    const input = createUserSchema.parse(await request.json());
    const user = await createSchoolUser({ ...input, schoolId: session.schoolId });
    if (input.role === UserRole.TEACHER) {
      const teacherCount = await prisma.teacher.count({ where: { schoolId: session.schoolId } });
      await prisma.teacher.create({ data: { schoolId: session.schoolId, userId: user.id, employeeCode: input.employeeCode || `FAC-${String(teacherCount + 1).padStart(4, "0")}` } });
    }
    return created(user);
  } catch (error) {
    return handleApiError(error);
  }
}

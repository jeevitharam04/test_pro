import { UserRole } from "@prisma/client";
import { z } from "zod";
import { listUsers } from "@/modules/users/user.service";
import { createInvitation } from "@/modules/auth/invitation.service";
import { getSession } from "@/shared/auth/session";
import { fail, handleApiError, ok, created } from "@/shared/http/responses";
import { assertPermission } from "@/shared/rbac/permissions";

const createUserSchema = z.object({
  email: z.string().email().toLowerCase(),
  name: z.string().min(2).max(120),
  phone: z.string().min(8).max(20).optional(),
  role: z.enum([UserRole.TEACHER, UserRole.PARENT, UserRole.STUDENT]),
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
    return created(await createInvitation({ ...input, schoolId: session.schoolId, createdByUserId: session.userId }));
  } catch (error) {
    return handleApiError(error);
  }
}

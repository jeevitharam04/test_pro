import { createExamType, listExamTypes } from "@/modules/marks/marks.service";
import { getSession } from "@/shared/auth/session";
import { created, fail, handleApiError, ok } from "@/shared/http/responses";
import { assertPermission } from "@/shared/rbac/permissions";
import { createExamTypeSchema } from "@/shared/validation/mvp";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.schoolId) return fail("Unauthenticated", 401);
    assertPermission(session.role, "marks", "read");
    return ok(await listExamTypes(session.schoolId));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.schoolId) return fail("Unauthenticated", 401);
    assertPermission(session.role, "marks", "manage");
    return created(await createExamType(session.schoolId, createExamTypeSchema.parse(await request.json())));
  } catch (error) {
    return handleApiError(error);
  }
}

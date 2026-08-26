import { createClass, listClasses } from "@/modules/classes/class.service";
import { getSession } from "@/shared/auth/session";
import { created, fail, handleApiError, ok } from "@/shared/http/responses";
import { assertPermission } from "@/shared/rbac/permissions";
import { createClassSchema } from "@/shared/validation/classes";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.schoolId) return fail("Unauthenticated", 401);

    assertPermission(session.role, "classes", "read");
    return ok(await listClasses(session.schoolId));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.schoolId) return fail("Unauthenticated", 401);

    assertPermission(session.role, "classes", "manage");
    const input = createClassSchema.parse(await request.json());
    return created(await createClass(session.schoolId, input, session.userId));
  } catch (error) {
    return handleApiError(error);
  }
}

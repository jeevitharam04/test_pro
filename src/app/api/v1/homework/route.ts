import { createHomework, listHomework } from "@/modules/homework/homework.service";
import { getSession } from "@/shared/auth/session";
import { created, fail, handleApiError, ok } from "@/shared/http/responses";
import { assertPermission } from "@/shared/rbac/permissions";
import { createHomeworkSchema } from "@/shared/validation/mvp";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.schoolId) return fail("Unauthenticated", 401);
    assertPermission(session.role, "homework", "read");
    return ok(await listHomework(session.schoolId, new URL(request.url).searchParams.get("classId") ?? undefined));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.schoolId) return fail("Unauthenticated", 401);
    assertPermission(session.role, "homework", "manage");
    return created(await createHomework(session.schoolId, session.userId, createHomeworkSchema.parse(await request.json())));
  } catch (error) {
    return handleApiError(error);
  }
}

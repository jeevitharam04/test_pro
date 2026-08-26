import { createSubject, listSubjects } from "@/modules/subjects/subject.service";
import { getSession } from "@/shared/auth/session";
import { created, fail, handleApiError, ok } from "@/shared/http/responses";
import { assertPermission } from "@/shared/rbac/permissions";
import { createSubjectSchema } from "@/shared/validation/classes";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.schoolId) return fail("Unauthenticated", 401);

    assertPermission(session.role, "subjects", "read");
    const { searchParams } = new URL(request.url);
    return ok(await listSubjects(session.schoolId, searchParams.get("classId") ?? undefined));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.schoolId) return fail("Unauthenticated", 401);

    assertPermission(session.role, "subjects", "manage");
    const input = createSubjectSchema.parse(await request.json());
    return created(await createSubject(session.schoolId, input, session.userId));
  } catch (error) {
    return handleApiError(error);
  }
}

import { listMarks, upsertMarks } from "@/modules/marks/marks.service";
import { getSession } from "@/shared/auth/session";
import { created, fail, handleApiError, ok } from "@/shared/http/responses";
import { assertPermission } from "@/shared/rbac/permissions";
import { upsertMarksSchema } from "@/shared/validation/mvp";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.schoolId) return fail("Unauthenticated", 401);
    assertPermission(session.role, "marks", "read");
    const searchParams = new URL(request.url).searchParams;
    return ok(
      await listMarks(session.schoolId, {
        classId: searchParams.get("classId") ?? undefined,
        studentId: searchParams.get("studentId") ?? undefined
      })
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.schoolId) return fail("Unauthenticated", 401);
    assertPermission(session.role, "marks", "manage");
    return created(await upsertMarks(session.schoolId, upsertMarksSchema.parse(await request.json())));
  } catch (error) {
    return handleApiError(error);
  }
}

import { createTimetableEntry, listTimetable } from "@/modules/timetable/timetable.service";
import { getSession } from "@/shared/auth/session";
import { created, fail, handleApiError, ok } from "@/shared/http/responses";
import { assertPermission } from "@/shared/rbac/permissions";
import { createTimetableEntrySchema } from "@/shared/validation/mvp";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.schoolId) return fail("Unauthenticated", 401);
    assertPermission(session.role, "timetable", "read");
    const searchParams = new URL(request.url).searchParams;
    return ok(
      await listTimetable(session.schoolId, {
        classId: searchParams.get("classId") ?? undefined,
        teacherId: searchParams.get("teacherId") ?? undefined
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
    assertPermission(session.role, "timetable", "manage");
    return created(await createTimetableEntry(session.schoolId, createTimetableEntrySchema.parse(await request.json())));
  } catch (error) {
    return handleApiError(error);
  }
}

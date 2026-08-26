import { listAttendance, markBulkAttendance } from "@/modules/attendance/attendance-crud.service";
import { getSession } from "@/shared/auth/session";
import { created, fail, handleApiError, ok } from "@/shared/http/responses";
import { assertPermission } from "@/shared/rbac/permissions";
import { bulkAttendanceSchema } from "@/shared/validation/mvp";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.schoolId) return fail("Unauthenticated", 401);
    assertPermission(session.role, "attendance", "read");
    const searchParams = new URL(request.url).searchParams;
    return ok(
      await listAttendance(session.schoolId, {
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
    assertPermission(session.role, "attendance", "manage");
    const input = bulkAttendanceSchema.parse(await request.json());
    return created(await markBulkAttendance(session.schoolId, session.userId, input));
  } catch (error) {
    return handleApiError(error);
  }
}

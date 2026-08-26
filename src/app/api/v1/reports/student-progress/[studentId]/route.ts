import { getStudentProgressReport } from "@/modules/reports/report.service";
import { getSession } from "@/shared/auth/session";
import { fail, handleApiError, ok } from "@/shared/http/responses";
import { assertPermission } from "@/shared/rbac/permissions";

type Params = { params: Promise<{ studentId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await getSession();
    if (!session?.schoolId) return fail("Unauthenticated", 401);
    assertPermission(session.role, "reports", "read");
    const { studentId } = await params;
    return ok(await getStudentProgressReport(session.schoolId, studentId));
  } catch (error) {
    return handleApiError(error);
  }
}

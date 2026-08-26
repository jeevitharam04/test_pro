import { getSchoolSummaryReport } from "@/modules/reports/report.service";
import { getSession } from "@/shared/auth/session";
import { fail, handleApiError, ok } from "@/shared/http/responses";
import { assertPermission } from "@/shared/rbac/permissions";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.schoolId) return fail("Unauthenticated", 401);
    assertPermission(session.role, "reports", "read");
    return ok(await getSchoolSummaryReport(session.schoolId));
  } catch (error) {
    return handleApiError(error);
  }
}

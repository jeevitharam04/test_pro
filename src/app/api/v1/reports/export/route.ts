import { UserRole } from "@prisma/client";
import { exportSchoolReport } from "@/modules/reports/report.service";
import { fail, handleApiError } from "@/shared/http/responses";
import { getSession } from "@/shared/auth/session";
import { assertPermission } from "@/shared/rbac/permissions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.schoolId) return fail("Unauthenticated", 401);
    assertPermission(session.role, "reports", "read");
    if (session.role !== UserRole.PRINCIPAL) return fail("Only principals can export school reports", 403);

    const type = new URL(request.url).searchParams.get("type");
    if (type !== "marks" && type !== "attendance") return fail("Report type must be marks or attendance", 422);

    const csv = await exportSchoolReport(session.schoolId, type);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=educare-${type}-report.csv`,
        "Cache-Control": "private, no-store"
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
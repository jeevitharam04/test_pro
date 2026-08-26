import { listPayments } from "@/modules/fees/fee.service";
import { getSession } from "@/shared/auth/session";
import { fail, handleApiError, ok } from "@/shared/http/responses";
import { assertPermission } from "@/shared/rbac/permissions";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.schoolId) return fail("Unauthenticated", 401);
    assertPermission(session.role, "fees", "read");
    return ok(await listPayments(session.schoolId, new URL(request.url).searchParams.get("studentId") ?? undefined));
  } catch (error) {
    return handleApiError(error);
  }
}

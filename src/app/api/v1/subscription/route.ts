import { getSubscriptionUsage } from "@/modules/schools/subscription.service";
import { fail, handleApiError, ok } from "@/shared/http/responses";
import { getSession } from "@/shared/auth/session";
import { assertPermission } from "@/shared/rbac/permissions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.schoolId) return fail("Unauthenticated", 401);
    assertPermission(session.role, "school", "read");
    return ok(await getSubscriptionUsage(session.schoolId));
  } catch (error) {
    return handleApiError(error);
  }
}
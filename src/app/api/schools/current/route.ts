import { getSchoolOverview, updateSchoolSettings } from "@/modules/schools/school.service";
import { getSession } from "@/shared/auth/session";
import { assertPermission } from "@/shared/rbac/permissions";
import { fail, handleApiError, ok } from "@/shared/http/responses";
import { isPlanName } from "@/modules/schools/subscription.service";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  subscriptionPlan: z.string().refine(isPlanName, "Subscription plan must be starter, growth, or institution").optional(),
  attendanceMode: z.enum(["DAILY", "SUBJECT_WISE", "SESSION_WISE"]).optional(),
  presentAdditionPercent: z.number().min(0).max(100).optional(),
  absentDeductionPercent: z.number().min(0).max(100).optional(),
  leavePercentChange: z.number().min(-100).max(100).optional()
});

export async function GET() {
  const session = await getSession();
  if (!session?.schoolId) {
    return fail("Unauthenticated", 401);
  }

  assertPermission(session.role, "school", "read");
  return ok(await getSchoolOverview(session.schoolId));
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session?.schoolId) {
      return fail("Unauthenticated", 401);
    }

    assertPermission(session.role, "school", "manage");
    const input = updateSchema.parse(await request.json());
    return ok(await updateSchoolSettings(session.schoolId, input));
  } catch (error) {
    return handleApiError(error);
  }
}

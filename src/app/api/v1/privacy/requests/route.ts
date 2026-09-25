import { PrivacyRequestStatus, PrivacyRequestType, UserRole } from "@prisma/client";
import { z } from "zod";
import { createPrivacyRequest, listPrivacyRequests, updatePrivacyRequest } from "@/modules/privacy/privacy.service";
import { fail, handleApiError, ok, created } from "@/shared/http/responses";
import { getSession } from "@/shared/auth/session";
import { assertPermission } from "@/shared/rbac/permissions";

const createSchema = z.object({
  type: z.enum([PrivacyRequestType.ACCESS, PrivacyRequestType.DELETION]),
  note: z.string().max(2000).optional()
});

const updateSchema = z.object({
  requestId: z.string().uuid(),
  status: z.enum([PrivacyRequestStatus.IN_REVIEW, PrivacyRequestStatus.COMPLETED, PrivacyRequestStatus.REJECTED])
});

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.schoolId) return fail("Unauthenticated", 401);
    const requesterId = session.role === UserRole.PRINCIPAL ? undefined : session.userId;
    return ok(await listPrivacyRequests(session.schoolId, requesterId));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.schoolId) return fail("Unauthenticated", 401);
    const input = createSchema.parse(await request.json());
    return created(await createPrivacyRequest({ ...input, schoolId: session.schoolId, requesterId: session.userId }));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session?.schoolId) return fail("Unauthenticated", 401);
    assertPermission(session.role, "school", "manage");
    const input = updateSchema.parse(await request.json());
    return ok(await updatePrivacyRequest({ ...input, schoolId: session.schoolId, reviewerId: session.userId }));
  } catch (error) {
    return handleApiError(error);
  }
}
import { createFeeStructure, listFeeStructures } from "@/modules/fees/fee.service";
import { getSession } from "@/shared/auth/session";
import { created, fail, handleApiError, ok } from "@/shared/http/responses";
import { assertPermission } from "@/shared/rbac/permissions";
import { createFeeStructureSchema } from "@/shared/validation/mvp";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.schoolId) return fail("Unauthenticated", 401);
    assertPermission(session.role, "fees", "read");
    return ok(await listFeeStructures(session.schoolId));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.schoolId) return fail("Unauthenticated", 401);
    assertPermission(session.role, "fees", "manage");
    return created(await createFeeStructure(session.schoolId, createFeeStructureSchema.parse(await request.json())));
  } catch (error) {
    return handleApiError(error);
  }
}

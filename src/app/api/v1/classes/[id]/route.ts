import { deleteClass, getClassById, updateClass } from "@/modules/classes/class.service";
import { getSession } from "@/shared/auth/session";
import { fail, handleApiError, ok } from "@/shared/http/responses";
import { assertPermission } from "@/shared/rbac/permissions";
import { updateClassSchema } from "@/shared/validation/classes";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await getSession();
    if (!session?.schoolId) return fail("Unauthenticated", 401);

    assertPermission(session.role, "classes", "read");
    const { id } = await params;
    const classRecord = await getClassById(session.schoolId, id);

    if (!classRecord) return fail("Class not found", 404);
    return ok(classRecord);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await getSession();
    if (!session?.schoolId) return fail("Unauthenticated", 401);

    assertPermission(session.role, "classes", "manage");
    const { id } = await params;
    const input = updateClassSchema.parse(await request.json());
    return ok(await updateClass(session.schoolId, id, input));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const session = await getSession();
    if (!session?.schoolId) return fail("Unauthenticated", 401);

    assertPermission(session.role, "classes", "manage");
    const { id } = await params;
    await deleteClass(session.schoolId, id);
    return ok({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

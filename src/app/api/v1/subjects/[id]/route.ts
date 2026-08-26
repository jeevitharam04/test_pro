import { deleteSubject, getSubjectById, updateSubject } from "@/modules/subjects/subject.service";
import { getSession } from "@/shared/auth/session";
import { fail, handleApiError, ok } from "@/shared/http/responses";
import { assertPermission } from "@/shared/rbac/permissions";
import { updateSubjectSchema } from "@/shared/validation/classes";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await getSession();
    if (!session?.schoolId) return fail("Unauthenticated", 401);

    assertPermission(session.role, "subjects", "read");
    const { id } = await params;
    const subject = await getSubjectById(session.schoolId, id);

    if (!subject) return fail("Subject not found", 404);
    return ok(subject);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await getSession();
    if (!session?.schoolId) return fail("Unauthenticated", 401);

    assertPermission(session.role, "subjects", "manage");
    const { id } = await params;
    const input = updateSubjectSchema.parse(await request.json());
    return ok(await updateSubject(session.schoolId, id, input));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const session = await getSession();
    if (!session?.schoolId) return fail("Unauthenticated", 401);

    assertPermission(session.role, "subjects", "manage");
    const { id } = await params;
    await deleteSubject(session.schoolId, id);
    return ok({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

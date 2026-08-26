import { deleteStudent, updateStudent } from "@/modules/students/student.service";
import { prisma } from "@/infrastructure/prisma/client";
import { getSession } from "@/shared/auth/session";
import { fail, handleApiError, ok } from "@/shared/http/responses";
import { assertPermission } from "@/shared/rbac/permissions";
import { updateStudentSchema } from "@/shared/validation/mvp";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await getSession();
    if (!session?.schoolId) return fail("Unauthenticated", 401);
    assertPermission(session.role, "students", "read");
    const { id } = await params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
    const student = await prisma.student.findFirst({
      where: { schoolId: session.schoolId, deletedAt: null, ...(isUuid ? { OR: [{ id }, { admissionNo: id }] } : { admissionNo: id }) },
      select: { id: true, admissionNo: true, user: { select: { name: true } } }
    });
    if (!student) return fail("Student not found", 404);
    return ok(student);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await getSession();
    if (!session?.schoolId) return fail("Unauthenticated", 401);
    assertPermission(session.role, "students", "manage");
    const { id } = await params;
    const input = updateStudentSchema.parse(await request.json());
    return ok(await updateStudent(session.schoolId, id, input));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const session = await getSession();
    if (!session?.schoolId) return fail("Unauthenticated", 401);
    assertPermission(session.role, "students", "manage");
    const { id } = await params;
    await deleteStudent(session.schoolId, id);
    return ok({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

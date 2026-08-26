import { createStudent, listStudents } from "@/modules/students/student.service";
import { getSession } from "@/shared/auth/session";
import { created, fail, handleApiError, ok } from "@/shared/http/responses";
import { assertPermission } from "@/shared/rbac/permissions";
import { createStudentSchema } from "@/shared/validation/mvp";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.schoolId) return fail("Unauthenticated", 401);
    assertPermission(session.role, "students", "read");
    const classId = new URL(request.url).searchParams.get("classId") ?? undefined;
    return ok(await listStudents(session.schoolId, classId));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.schoolId) return fail("Unauthenticated", 401);
    assertPermission(session.role, "students", "manage");
    const input = createStudentSchema.parse(await request.json());
    return created(await createStudent(session.schoolId, input, session.userId));
  } catch (error) {
    return handleApiError(error);
  }
}

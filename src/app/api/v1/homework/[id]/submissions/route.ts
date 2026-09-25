import { submitHomework } from "@/modules/homework/homework.service";
import { getSession } from "@/shared/auth/session";
import { created, fail, handleApiError } from "@/shared/http/responses";
import { assertPermission } from "@/shared/rbac/permissions";
import { homeworkSubmissionSchema } from "@/shared/validation/mvp";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const session = await getSession();
    if (!session?.schoolId) return fail("Unauthenticated", 401);
    assertPermission(session.role, "homework", "read");
    const { id } = await params;
    return created(await submitHomework(session.schoolId, id, session.userId, homeworkSubmissionSchema.parse(await request.json())));
  } catch (error) {
    return handleApiError(error);
  }
}

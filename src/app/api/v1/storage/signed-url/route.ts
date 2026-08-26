import { randomUUID } from "crypto";
import { getSession } from "@/shared/auth/session";
import { created, fail, handleApiError } from "@/shared/http/responses";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.schoolId) return fail("Unauthenticated", 401);
    const body = (await request.json()) as { filename?: string; contentType?: string };
    const key = `${session.schoolId}/${randomUUID()}-${body.filename ?? "upload"}`;

    return created({
      key,
      method: "PUT",
      contentType: body.contentType ?? "application/octet-stream",
      uploadUrl: `s3://${process.env.S3_BUCKET ?? "educare-local"}/${key}`,
      expiresInSeconds: 900
    });
  } catch (error) {
    return handleApiError(error);
  }
}

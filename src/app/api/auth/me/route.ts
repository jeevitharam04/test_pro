import { getSession } from "@/shared/auth/session";
import { fail, ok } from "@/shared/http/responses";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return fail("Unauthenticated", 401);
  }

  return ok(session);
}

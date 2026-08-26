import { cookies } from "next/headers";
import { AuthError, refreshSession } from "@/modules/auth/auth.service";
import { REFRESH_TOKEN_COOKIE } from "@/shared/auth/cookies";
import { fail, handleApiError, ok } from "@/shared/http/responses";
import { refreshSchema } from "@/shared/validation/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const input = refreshSchema.parse(body);
    const cookieStore = await cookies();
    const refreshToken = input.refreshToken ?? cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

    return ok(await refreshSession(refreshToken));
  } catch (error) {
    if (error instanceof AuthError) {
      return fail(error.message, error.status);
    }

    return handleApiError(error);
  }
}

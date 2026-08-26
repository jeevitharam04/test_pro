import { login, AuthError } from "@/modules/auth/auth.service";
import { fail, handleApiError, ok } from "@/shared/http/responses";
import { checkRedisRateLimit } from "@/shared/http/rate-limit";
import { loginSchema } from "@/shared/validation/auth";

export async function POST(request: Request) {
  try {
    const input = loginSchema.parse(await request.json());
    const limit = await checkRedisRateLimit(`login:${input.email}`, 10, 60_000);

    if (!limit.allowed) {
      return fail("Too many login attempts. Try again shortly.", 429);
    }

    return ok(await login(input));
  } catch (error) {
    if (error instanceof AuthError) {
      return fail(error.message, error.status);
    }

    return handleApiError(error);
  }
}

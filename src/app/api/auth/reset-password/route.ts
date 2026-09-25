import { resetPassword, AuthError } from "@/modules/auth/auth.service";
import { fail, handleApiError, ok } from "@/shared/http/responses";
import { resetPasswordSchema } from "@/shared/validation/auth";

export async function POST(request: Request) {
  try {
    const input = resetPasswordSchema.parse(await request.json());
    await resetPassword(input.token, input.password);
    return ok({ reset: true });
  } catch (error) {
    if (error instanceof AuthError) return fail(error.message, error.status);
    return handleApiError(error);
  }
}

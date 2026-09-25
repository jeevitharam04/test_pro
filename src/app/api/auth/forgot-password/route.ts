import { requestPasswordReset } from "@/modules/auth/auth.service";
import { handleApiError, ok } from "@/shared/http/responses";
import { forgotPasswordSchema } from "@/shared/validation/auth";

export async function POST(request: Request) {
  try {
    const input = forgotPasswordSchema.parse(await request.json());
    const token = await requestPasswordReset(input.email);
    return ok({
      accepted: true,
      message: "If that email is registered, password reset instructions will be sent shortly.",
      ...(process.env.NODE_ENV === "development" && token ? { developmentToken: token } : {})
    });
  } catch (error) {
    return handleApiError(error);
  }
}

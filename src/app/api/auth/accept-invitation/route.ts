import { acceptInvitation } from "@/modules/auth/invitation.service";
import { handleApiError, ok, fail } from "@/shared/http/responses";
import { acceptInvitationSchema } from "@/shared/validation/auth";

export async function POST(request: Request) {
  try {
    const input = acceptInvitationSchema.parse(await request.json());
    const user = await acceptInvitation(input.token, input.password);
    return ok({ accepted: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    if (error instanceof Error && (error.message === "Invalid or expired invitation" || error.message === "This email is already registered")) return fail(error.message, 400);
    return handleApiError(error);
  }
}
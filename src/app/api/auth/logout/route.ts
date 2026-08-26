import { logoutFromCookies } from "@/modules/auth/auth.service";
import { handleApiError, ok } from "@/shared/http/responses";

export async function POST() {
  try {
    await logoutFromCookies();
    return ok({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

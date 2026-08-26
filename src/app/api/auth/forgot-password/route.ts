import { ok } from "@/shared/http/responses";

export async function POST() {
  return ok({
    accepted: true,
    message: "Password reset delivery queue will be wired to Resend in the notifications phase."
  });
}

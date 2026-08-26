import { ok } from "@/shared/http/responses";

export async function POST() {
  return ok({
    accepted: true,
    message: "Reset token validation will be completed when outbound email is enabled."
  });
}

import { NextResponse } from "next/server";
import { signupPrincipal, login } from "@/modules/auth/auth.service";
import { handleApiError } from "@/shared/http/responses";
import { signupSchema } from "@/shared/validation/auth";

export async function POST(request: Request) {
  try {
    const input = signupSchema.parse(await request.json());
    await signupPrincipal(input);
    const session = await login({ email: input.email, password: input.password });

    return NextResponse.json({ data: session }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

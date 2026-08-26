import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { logger } from "@/infrastructure/logger";
import { captureException } from "@/infrastructure/sentry";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function created<T>(data: T) {
  return ok(data, { status: 201 });
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: { message, details } }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return fail("Validation failed: check the highlighted fields", 422, error.flatten());
  }

  if (error instanceof Error && error.name === "ForbiddenError") {
    return fail("Forbidden", 403);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    const fields = Array.isArray(error.meta?.target) ? error.meta.target.join(", ") : "record";
    if (fields.includes("email")) return fail("This email is already registered. Use a different email address.", 409);
    if (fields.includes("slug")) return fail("This institution slug is already in use. Choose another slug.", 409);
    if (fields.includes("admissionNo")) return fail("This admission ID is already in use. Try again.", 409);
    return fail("This record already exists. Check the details and try again.", 409);
  }

  logger.error({ error }, "Unhandled API error");
  captureException(error);
  const reason = error instanceof Error ? error.message : "Unknown server failure";
  return fail(
    process.env.NODE_ENV === "development" ? `Internal server error: ${reason}` : "Internal server error",
    500
  );
}

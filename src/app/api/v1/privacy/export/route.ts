import { NextResponse } from "next/server";
import { exportUserData } from "@/modules/privacy/privacy.service";
import { fail, handleApiError } from "@/shared/http/responses";
import { getSession } from "@/shared/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.schoolId) {
      return fail("Unauthenticated", 401);
    }

    const data = await exportUserData(session.userId, session.schoolId);
    return NextResponse.json(data, {
      headers: {
        "Content-Disposition": "attachment; filename=educare-personal-data.json",
        "Cache-Control": "private, no-store"
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
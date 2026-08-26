import { createAnnouncement, listAnnouncements } from "@/modules/announcements/announcement.service";
import { getSession } from "@/shared/auth/session";
import { created, fail, handleApiError, ok } from "@/shared/http/responses";
import { assertPermission } from "@/shared/rbac/permissions";
import { createAnnouncementSchema } from "@/shared/validation/mvp";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.schoolId) return fail("Unauthenticated", 401);
    assertPermission(session.role, "announcements", "read");
    return ok(await listAnnouncements(session.schoolId, new URL(request.url).searchParams.get("classId") ?? undefined));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.schoolId) return fail("Unauthenticated", 401);
    assertPermission(session.role, "announcements", "manage");
    return created(await createAnnouncement(session.schoolId, session.userId, createAnnouncementSchema.parse(await request.json())));
  } catch (error) {
    return handleApiError(error);
  }
}

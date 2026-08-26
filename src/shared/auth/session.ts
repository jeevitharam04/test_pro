import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/infrastructure/prisma/client";
import { ACCESS_TOKEN_COOKIE } from "./cookies";
import { verifyAccessToken, type SessionClaims } from "./tokens";

export async function getSession(): Promise<SessionClaims | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    return await verifyAccessToken(token);
  } catch {
    return null;
  }
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function requireTenantSession() {
  const session = await requireSession();
  if (!session.schoolId) {
    redirect("/onboarding/school");
  }

  return { ...session, schoolId: session.schoolId };
}

export async function getFreshSessionUser(session: SessionClaims) {
  return prisma.user.findFirst({
    where: {
      id: session.userId,
      schoolId: session.schoolId,
      deletedAt: null
    },
    select: {
      id: true,
      schoolId: true,
      email: true,
      name: true,
      role: true
    }
  });
}

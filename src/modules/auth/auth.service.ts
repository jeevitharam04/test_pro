import { UserRole } from "@prisma/client";
import { prisma } from "@/infrastructure/prisma/client";
import { clearAuthCookies, REFRESH_TOKEN_COOKIE, setAuthCookies } from "@/shared/auth/cookies";
import { hashPassword, verifyPassword } from "@/shared/auth/password";
import {
  createRefreshToken,
  hashToken,
  signAccessToken,
  type SessionClaims
} from "@/shared/auth/tokens";

const maxFailedAttempts = 5;
const lockMinutes = 15;

export async function signupPrincipal(input: {
  schoolName: string;
  schoolSlug: string;
  name: string;
  email: string;
  phone?: string;
  password: string;
}) {
  const passwordHash = await hashPassword(input.password);

  return prisma.$transaction(async (tx) => {
    const school = await tx.school.create({
      data: {
        name: input.schoolName,
        slug: input.schoolSlug,
        subscriptionPlan: "starter",
        gradingConfig: {
          grades: [
            { grade: "A", min: 80 },
            { grade: "B", min: 60 },
            { grade: "C", min: 40 },
            { grade: "D", min: 0 }
          ]
        }
      }
    });

    const user = await tx.user.create({
      data: {
        schoolId: school.id,
        email: input.email,
        name: input.name,
        phone: input.phone,
        role: UserRole.PRINCIPAL,
        passwordHash
      }
    });

    await tx.auditLog.create({
      data: {
        schoolId: school.id,
        actorUserId: user.id,
        action: "auth.signup",
        entity: "School",
        entityId: school.id
      }
    });

    return { school, user };
  });
}

export async function login(input: { email: string; password: string }) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { school: true }
  });

  if (!user || user.deletedAt) {
    throw new AuthError("Invalid email or password");
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new AuthError("Account locked. Try again later.", 423);
  }

  const valid = await verifyPassword(input.password, user.passwordHash);

  if (!valid) {
    const failedLoginCount = user.failedLoginCount + 1;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount,
        lockedUntil:
          failedLoginCount >= maxFailedAttempts
            ? new Date(Date.now() + lockMinutes * 60 * 1000)
            : null
      }
    });

    throw new AuthError("Invalid email or password");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginCount: 0,
      lockedUntil: null,
      lastLoginAt: new Date()
    }
  });

  const claims: SessionClaims = {
    userId: user.id,
    schoolId: user.schoolId,
    role: user.role,
    email: user.email,
    name: user.name
  };

  const accessToken = await signAccessToken(claims);
  const refresh = createRefreshToken();

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: refresh.tokenHash,
      expiresAt: refresh.expiresAt
    }
  });

  await setAuthCookies(accessToken, refresh.token);

  return {
    accessToken,
    refreshToken: refresh.token,
    user: toPublicUser(user)
  };
}

export async function refreshSession(refreshToken: string | undefined) {
  if (!refreshToken) {
    throw new AuthError("Missing refresh token", 401);
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(refreshToken) },
    include: { user: true }
  });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date() || stored.user.deletedAt) {
    throw new AuthError("Invalid refresh token", 401);
  }

  const claims: SessionClaims = {
    userId: stored.user.id,
    schoolId: stored.user.schoolId,
    role: stored.user.role,
    email: stored.user.email,
    name: stored.user.name
  };

  const accessToken = await signAccessToken(claims);
  const nextRefresh = createRefreshToken();

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() }
    }),
    prisma.refreshToken.create({
      data: {
        userId: stored.user.id,
        tokenHash: nextRefresh.tokenHash,
        expiresAt: nextRefresh.expiresAt
      }
    })
  ]);

  await setAuthCookies(accessToken, nextRefresh.token);

  return {
    accessToken,
    refreshToken: nextRefresh.token,
    user: toPublicUser(stored.user)
  };
}

export async function logout(refreshToken?: string) {
  if (refreshToken) {
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }

  await clearAuthCookies();
}

export async function logoutFromCookies() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  await logout(cookieStore.get(REFRESH_TOKEN_COOKIE)?.value);
}

function toPublicUser(user: {
  id: string;
  schoolId: string | null;
  email: string;
  name: string;
  role: UserRole;
}) {
  return {
    id: user.id,
    schoolId: user.schoolId,
    email: user.email,
    name: user.name,
    role: user.role
  };
}

export class AuthError extends Error {
  constructor(
    message: string,
    public status = 401
  ) {
    super(message);
    this.name = "AuthError";
  }
}

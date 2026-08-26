import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@prisma/client";

const issuer = "educare";
const accessTokenTtl = "15m";

export type SessionClaims = {
  userId: string;
  schoolId: string | null;
  role: UserRole;
  email: string;
  name: string;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 24) {
    throw new Error("JWT_SECRET must be set to a strong value.");
  }

  return new TextEncoder().encode(secret);
}

export async function signAccessToken(claims: SessionClaims) {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(issuer)
    .setSubject(claims.userId)
    .setExpirationTime(accessTokenTtl)
    .sign(getJwtSecret());
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, getJwtSecret(), { issuer });

  return {
    userId: String(payload.userId),
    schoolId: payload.schoolId ? String(payload.schoolId) : null,
    role: payload.role as UserRole,
    email: String(payload.email),
    name: String(payload.name)
  } satisfies SessionClaims;
}

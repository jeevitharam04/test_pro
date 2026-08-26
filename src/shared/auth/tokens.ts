import { createHash, randomBytes } from "crypto";
export { signAccessToken, verifyAccessToken, type SessionClaims } from "./access-token";

const refreshTokenDays = 30;

export function createRefreshToken() {
  const token = randomBytes(48).toString("base64url");
  const expiresAt = new Date(Date.now() + refreshTokenDays * 24 * 60 * 60 * 1000);

  return { token, tokenHash: hashToken(token), expiresAt };
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

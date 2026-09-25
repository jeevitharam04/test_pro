import { prisma } from "@/infrastructure/prisma/client";
import { getRedisClient } from "@/infrastructure/redis/client";
import { ok } from "@/shared/http/responses";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks = {
    app: "ok",
    database: "unknown",
    redis: "unknown"
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch {
    checks.database = "unavailable";
  }

  try {
    const redis = getRedisClient();
    await redis.ping();
    checks.redis = "ok";
  } catch {
    checks.redis = "unavailable";
  }

  return ok({
    status: checks.database === "ok" ? "ok" : "degraded",
    checks,
    timestamp: new Date().toISOString()
  });
}

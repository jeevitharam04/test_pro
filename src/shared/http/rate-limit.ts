import { getRedisClient } from "@/infrastructure/redis/client";
import { logger } from "@/infrastructure/logger";

const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (current.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterMs: current.resetAt - now };
  }

  current.count += 1;
  return { allowed: true, remaining: limit - current.count };
}

export async function checkRedisRateLimit(key: string, limit: number, windowMs: number) {
  try {
    const redis = getRedisClient();
    const redisKey = `rate-limit:${key}`;
    const count = await redis.incr(redisKey);

    if (count === 1) {
      await redis.pexpire(redisKey, windowMs);
    }

    if (count > limit) {
      const retryAfterMs = await redis.pttl(redisKey);
      return { allowed: false, remaining: 0, retryAfterMs };
    }

    return { allowed: true, remaining: Math.max(limit - count, 0) };
  } catch (error) {
    logger.warn({ error, key }, "Redis rate limit unavailable, using in-memory fallback");
    return checkRateLimit(key, limit, windowMs);
  }
}

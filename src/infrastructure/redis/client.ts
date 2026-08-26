import IORedis from "ioredis";

export function getRedisConnectionOptions() {
  const url = new URL(process.env.REDIS_URL ?? "redis://localhost:6379");

  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    password: url.password || undefined,
    username: url.username || undefined,
    maxRetriesPerRequest: null
  };
}

const globalForRedis = globalThis as unknown as {
  redis?: IORedis;
};

export function getRedisClient() {
  if (!globalForRedis.redis) {
    globalForRedis.redis = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false
    });

    globalForRedis.redis.on("error", () => {
      // The caller falls back when Redis is unavailable.
    });
  }

  return globalForRedis.redis;
}

import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: {
    service: "educare-api"
  },
  redact: {
    paths: ["password", "passwordHash", "authorization", "cookie", "*.token", "*.refreshToken"],
    remove: true
  }
});

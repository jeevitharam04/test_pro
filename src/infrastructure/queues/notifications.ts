import { Queue } from "bullmq";
import { getRedisConnectionOptions } from "@/infrastructure/redis/client";

export const emailQueue = new Queue("email", { connection: getRedisConnectionOptions() });
export const smsQueue = new Queue("sms", { connection: getRedisConnectionOptions() });

export type NotificationJob = {
  schoolId: string;
  userId?: string;
  to: string;
  title: string;
  body: string;
};

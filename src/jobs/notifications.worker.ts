import { Worker } from "bullmq";
import { getRedisConnectionOptions } from "@/infrastructure/redis/client";

export const emailWorker = new Worker(
  "email",
  async (job) => {
    console.log("Send email notification", job.data);
  },
  { connection: getRedisConnectionOptions() }
);

export const smsWorker = new Worker(
  "sms",
  async (job) => {
    console.log("Send SMS notification", job.data);
  },
  { connection: getRedisConnectionOptions() }
);

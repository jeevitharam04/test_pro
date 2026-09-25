import { Queue } from "bullmq";
import { NotificationChannel } from "@prisma/client";
import { prisma } from "@/infrastructure/prisma/client";
import { getRedisConnectionOptions } from "@/infrastructure/redis/client";

export const emailQueue = new Queue("email", { connection: getRedisConnectionOptions() });
export const smsQueue = new Queue("sms", { connection: getRedisConnectionOptions() });

export type NotificationJob = {
  notificationId: string;
  schoolId: string;
  userId?: string;
  to: string;
  title: string;
  body: string;
};

export async function enqueueNotification(input: {
  schoolId: string;
  userId?: string;
  channel: NotificationChannel;
  to: string;
  title: string;
  body: string;
  metadata?: Record<string, string>;
}) {
  const notification = await prisma.notification.create({
    data: {
      schoolId: input.schoolId,
      userId: input.userId,
      channel: input.channel,
      title: input.title,
      body: input.body,
      metadata: input.metadata,
      status: "QUEUED"
    }
  });

  const job: NotificationJob = {
    notificationId: notification.id,
    schoolId: input.schoolId,
    userId: input.userId,
    to: input.to,
    title: input.title,
    body: input.body
  };

  const queue = input.channel === NotificationChannel.EMAIL ? emailQueue : smsQueue;
  await queue.add("deliver", job, {
    attempts: 3,
    backoff: { type: "exponential", delay: 5_000 },
    removeOnComplete: 100,
    removeOnFail: 500
  });

  return notification;
}

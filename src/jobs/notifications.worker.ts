import { Worker } from "bullmq";
import { NotificationStatus } from "@prisma/client";
import { prisma } from "@/infrastructure/prisma/client";
import { getRedisConnectionOptions } from "@/infrastructure/redis/client";
import type { NotificationJob } from "@/infrastructure/queues/notifications";

async function markSent(job: NotificationJob) {
  await prisma.notification.update({ where: { id: job.notificationId }, data: { status: NotificationStatus.SENT, sentAt: new Date() } });
}

async function markFailed(job: NotificationJob, error: unknown) {
  await prisma.notification.update({
    where: { id: job.notificationId },
    data: { status: NotificationStatus.FAILED, metadata: { error: error instanceof Error ? error.message : "Delivery failed" } }
  });
}

async function sendEmail(job: NotificationJob) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("Email provider is not configured");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [job.to], subject: job.title, text: job.body })
  });
  if (!response.ok) throw new Error(`Email provider returned ${response.status}`);
}

async function sendSms(job: NotificationJob) {
  const authKey = process.env.MSG91_AUTH_KEY;
  const senderId = process.env.MSG91_SENDER_ID;
  if (!authKey || !senderId) throw new Error("SMS provider is not configured");
  const response = await fetch("https://control.msg91.com/api/v5/flow/", {
    method: "POST",
    headers: { authkey: authKey, "Content-Type": "application/json" },
    body: JSON.stringify({ sender: senderId, mobiles: job.to, message: job.body })
  });
  if (!response.ok) throw new Error(`SMS provider returned ${response.status}`);
}

export const emailWorker = new Worker(
  "email",
  async (job) => {
    const data = job.data as NotificationJob;
    try {
      await sendEmail(data);
      await markSent(data);
    } catch (error) {
      await markFailed(data, error);
      throw error;
    }
  },
  { connection: getRedisConnectionOptions() }
);

export const smsWorker = new Worker(
  "sms",
  async (job) => {
    const data = job.data as NotificationJob;
    try {
      await sendSms(data);
      await markSent(data);
    } catch (error) {
      await markFailed(data, error);
      throw error;
    }
  },
  { connection: getRedisConnectionOptions() }
);

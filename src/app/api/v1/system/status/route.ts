import { ok } from "@/shared/http/responses";

export async function GET() {
  return ok({
    integrations: {
      database: Boolean(process.env.DATABASE_URL),
      redis: Boolean(process.env.REDIS_URL),
      razorpay: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_SECRET),
      resend: Boolean(process.env.RESEND_API_KEY),
      msg91: Boolean(process.env.MSG91_API_KEY),
      s3: Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.S3_BUCKET),
      sentry: Boolean(process.env.SENTRY_DSN),
      googleOAuth: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      microsoftOAuth: Boolean(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET)
    }
  });
}

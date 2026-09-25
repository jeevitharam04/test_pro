import { prisma } from "@/infrastructure/prisma/client";
import { fail, handleApiError, ok } from "@/shared/http/responses";
import { verifyRazorpaySignature } from "@/shared/payments/razorpay";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") ?? "";
    const secret = process.env.RAZORPAY_SECRET;
    if (!secret || !signature) return fail("Webhook verification is not configured", 503);

    if (!verifyRazorpaySignature(rawBody, signature, secret)) return fail("Invalid webhook signature", 401);

    const event = JSON.parse(rawBody) as {
      event?: string;
      payload?: { payment?: { entity?: { order_id?: string; id?: string } } };
    };

    if (event.event === "payment.captured") {
      const payment = event.payload?.payment?.entity;
      if (!payment?.order_id || !payment.id) return fail("Invalid payment payload", 400);
      await prisma.payment.updateMany({
        where: { razorpayOrderId: payment.order_id, status: "CREATED" },
        data: {
          status: "PAID",
          razorpayPaymentId: payment?.id,
          receiptNumber: `RCP-${Date.now()}`,
          paidAt: new Date()
        }
      });
    }

    return ok({ received: true });
  } catch (error) {
    return handleApiError(error);
  }
}

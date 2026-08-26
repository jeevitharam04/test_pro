import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/infrastructure/prisma/client";
import { fail, handleApiError, ok } from "@/shared/http/responses";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") ?? "";
    const secret = process.env.RAZORPAY_SECRET;

    if (secret) {
      const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
      const valid =
        signature.length === expected.length &&
        timingSafeEqual(Buffer.from(signature), Buffer.from(expected));

      if (!valid) return fail("Invalid webhook signature", 401);
    }

    const event = JSON.parse(rawBody) as {
      event?: string;
      payload?: { payment?: { entity?: { order_id?: string; id?: string } } };
    };

    if (event.event === "payment.captured") {
      const payment = event.payload?.payment?.entity;
      await prisma.payment.updateMany({
        where: { razorpayOrderId: payment?.order_id },
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

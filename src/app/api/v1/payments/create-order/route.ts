import { createPaymentOrder } from "@/modules/fees/fee.service";
import { getSession } from "@/shared/auth/session";
import { created, fail, handleApiError } from "@/shared/http/responses";
import { assertPermission } from "@/shared/rbac/permissions";
import { createPaymentOrderSchema } from "@/shared/validation/mvp";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.schoolId) return fail("Unauthenticated", 401);
    assertPermission(session.role, "fees", "read");
    const payment = await createPaymentOrder(session.schoolId, createPaymentOrderSchema.parse(await request.json()));
    return created({
      payment,
      checkout: {
        provider: "razorpay",
        keyId: process.env.RAZORPAY_KEY_ID ?? "",
        orderId: payment.razorpayOrderId
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}

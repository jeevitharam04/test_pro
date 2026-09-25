import { createHmac } from "crypto";
import { verifyRazorpaySignature } from "./razorpay";

describe("Razorpay webhook signatures", () => {
  const body = JSON.stringify({ event: "payment.captured" });
  const secret = "test-secret";

  it("accepts a signature generated from the raw request body", () => {
    const signature = createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyRazorpaySignature(body, signature, secret)).toBe(true);
  });

  it("rejects altered bodies and malformed signatures", () => {
    const signature = createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyRazorpaySignature(`${body}.changed`, signature, secret)).toBe(false);
    expect(verifyRazorpaySignature(body, "invalid", secret)).toBe(false);
  });
});
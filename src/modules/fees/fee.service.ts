import { prisma } from "@/infrastructure/prisma/client";

export function createFeeStructure(
  schoolId: string,
  input: { name: string; classId?: string; amount: number; dueDate: Date; lateFee: number; discount: number }
) {
  return prisma.feeStructure.create({ data: { schoolId, ...input } });
}

export function listFeeStructures(schoolId: string) {
  return prisma.feeStructure.findMany({
    where: { schoolId, deletedAt: null },
    orderBy: { dueDate: "asc" }
  });
}

export function listPayments(schoolId: string, studentId?: string) {
  return prisma.payment.findMany({
    where: { schoolId, studentId, deletedAt: null },
    include: {
      student: { include: { user: { select: { name: true } } } },
      feeStructure: { select: { name: true, dueDate: true } }
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function createPaymentOrder(
  schoolId: string,
  input: { feeStructureId: string; studentId: string; amount: number }
) {
  const [fee, student] = await Promise.all([
    prisma.feeStructure.findFirst({ where: { id: input.feeStructureId, schoolId, deletedAt: null } }),
    prisma.student.findFirst({ where: { id: input.studentId, schoolId, deletedAt: null } })
  ]);
  if (!fee || !student || (fee.classId && fee.classId !== student.classId)) throw new Error("Fee or student does not belong to this school");
  const expectedAmount = Number(fee.amount) - Number(fee.discount);
  if (input.amount !== expectedAmount || expectedAmount <= 0) throw new Error("Payment amount does not match the fee amount");

  const keyId = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_SECRET;
  if (!keyId || !secret) throw new Error("Payment provider is not configured");
  const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ amount: Math.round(input.amount * 100), currency: "INR", receipt: `fee_${fee.id}_${student.id}` })
  });
  if (!razorpayResponse.ok) throw new Error("Payment provider rejected the order");
  const order = (await razorpayResponse.json()) as { id?: string };
  if (!order.id) throw new Error("Payment provider returned an invalid order");

  return prisma.payment.create({
    data: {
      schoolId,
      feeStructureId: input.feeStructureId,
      studentId: input.studentId,
      amount: input.amount,
      razorpayOrderId: order.id,
      status: "CREATED"
    }
  });
}

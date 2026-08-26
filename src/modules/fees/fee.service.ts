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

export function createPaymentOrder(
  schoolId: string,
  input: { feeStructureId: string; studentId: string; amount: number }
) {
  const orderId = `order_${Date.now()}`;
  return prisma.payment.create({
    data: {
      schoolId,
      feeStructureId: input.feeStructureId,
      studentId: input.studentId,
      amount: input.amount,
      razorpayOrderId: orderId,
      status: "CREATED"
    }
  });
}

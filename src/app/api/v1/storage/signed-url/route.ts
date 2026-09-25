import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/infrastructure/prisma/client";
import { getSession } from "@/shared/auth/session";
import { created, fail, handleApiError } from "@/shared/http/responses";
import { getPlanConfig } from "@/modules/schools/subscription.service";

const uploadSchema = z.object({
  filename: z.string().min(1).max(255).optional(),
  contentType: z.string().min(1).max(120).optional(),
  sizeBytes: z.number().int().positive().max(25 * 1024 * 1024)
});

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.schoolId) return fail("Unauthenticated", 401);
    const body = uploadSchema.parse(await request.json());
    const [school, stored] = await Promise.all([
      prisma.school.findFirst({ where: { id: session.schoolId, deletedAt: null }, select: { subscriptionPlan: true } }),
      prisma.studentDocument.aggregate({ where: { schoolId: session.schoolId, deletedAt: null }, _sum: { fileSizeBytes: true } })
    ]);
    const plan = getPlanConfig(school?.subscriptionPlan);
    const usedBytes = stored._sum.fileSizeBytes ?? 0;
    const limitBytes = plan.maxStorageGb * 1024 * 1024 * 1024;
    if (usedBytes + body.sizeBytes > limitBytes) {
      return fail(`Storage limit reached for the ${plan.name} plan (${plan.maxStorageGb} GB)`, 413);
    }

    const key = `${session.schoolId}/${randomUUID()}-${body.filename ?? "upload"}`;

    return created({
      key,
      method: "PUT",
      contentType: body.contentType ?? "application/octet-stream",
      sizeBytes: body.sizeBytes,
      uploadUrl: `s3://${process.env.S3_BUCKET ?? "educare-local"}/${key}`,
      expiresInSeconds: 900
    });
  } catch (error) {
    return handleApiError(error);
  }
}

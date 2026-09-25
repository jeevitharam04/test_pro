import { planCatalog, getPlanConfig } from "@/modules/schools/subscription.service";
import { ok } from "@/shared/http/responses";

export const dynamic = "force-static";

export async function GET() {
  return ok(Object.entries(planCatalog).map(([name, pricing]) => ({
    ...pricing,
    ...getPlanConfig(name)
  })));
}
import { created, handleRouteError, ok } from "@/lib/api";
import { requireUser } from "@/lib/rbac";
import { dealSchema } from "@/lib/validations";
import {
  createDeal,
  getPipelineStats,
  listDeals
} from "@/services/deal-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    const [items, stats] = await Promise.all([listDeals(user), getPipelineStats(user)]);

    return ok({ items, stats });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const input = dealSchema.parse(await request.json());
    return created(await createDeal(user, input));
  } catch (error) {
    return handleRouteError(error);
  }
}

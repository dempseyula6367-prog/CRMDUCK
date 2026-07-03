import { handleRouteError, ok } from "@/lib/api";
import { requireUser } from "@/lib/rbac";
import { getDashboardMetrics } from "@/services/dashboard-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    return ok(await getDashboardMetrics(user));
  } catch (error) {
    return handleRouteError(error);
  }
}

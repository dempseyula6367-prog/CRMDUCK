import { handleRouteError, ok } from "@/lib/api";
import { requireUser } from "@/lib/rbac";
import { listUsers } from "@/services/user-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    return ok(await listUsers(user));
  } catch (error) {
    return handleRouteError(error);
  }
}

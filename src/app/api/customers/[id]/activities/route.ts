import { created, handleRouteError } from "@/lib/api";
import { requireUser } from "@/lib/rbac";
import { activitySchema } from "@/lib/validations";
import { addCustomerActivity } from "@/services/customer-service";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const input = activitySchema.parse(await request.json());
    return created(await addCustomerActivity(user, params.id, input));
  } catch (error) {
    return handleRouteError(error);
  }
}

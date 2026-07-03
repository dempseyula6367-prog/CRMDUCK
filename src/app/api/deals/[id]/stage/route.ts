import { handleRouteError, ok } from "@/lib/api";
import { requireUser } from "@/lib/rbac";
import { updateDealStageSchema } from "@/lib/validations";
import { updateDealStage } from "@/services/deal-service";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const input = updateDealStageSchema.parse(await request.json());
    return ok(await updateDealStage(user, params.id, input.stage));
  } catch (error) {
    return handleRouteError(error);
  }
}

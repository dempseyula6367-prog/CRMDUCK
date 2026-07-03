import { empty, handleRouteError } from "@/lib/api";
import { requireUser } from "@/lib/rbac";
import { deleteDeal } from "@/services/deal-service";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    await deleteDeal(user, params.id);
    return empty();
  } catch (error) {
    return handleRouteError(error);
  }
}

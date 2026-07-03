import { handleRouteError, ok } from "@/lib/api";
import { requireUser } from "@/lib/rbac";
import { userRoleSchema } from "@/lib/validations";
import { updateUserRole } from "@/services/user-service";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const input = userRoleSchema.parse(await request.json());
    return ok(await updateUserRole(user, params.id, input.role));
  } catch (error) {
    return handleRouteError(error);
  }
}

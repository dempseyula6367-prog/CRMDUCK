import { empty, handleRouteError, ok } from "@/lib/api";
import { requireUser } from "@/lib/rbac";
import { taskSchema } from "@/lib/validations";
import { deleteTask, updateTask } from "@/services/task-service";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const input = taskSchema.parse(await request.json());
    return ok(await updateTask(user, params.id, input));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    await deleteTask(user, params.id);
    return empty();
  } catch (error) {
    return handleRouteError(error);
  }
}

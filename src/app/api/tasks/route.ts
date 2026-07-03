import { TaskStatus } from "@prisma/client";
import { created, handleRouteError, ok } from "@/lib/api";
import { requireUser } from "@/lib/rbac";
import { taskSchema } from "@/lib/validations";
import { createTask, listTasks } from "@/services/task-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);
    const status = url.searchParams.get("status") as TaskStatus | null;

    return ok(await listTasks(user, status ?? undefined));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const input = taskSchema.parse(await request.json());
    return created(await createTask(user, input));
  } catch (error) {
    return handleRouteError(error);
  }
}

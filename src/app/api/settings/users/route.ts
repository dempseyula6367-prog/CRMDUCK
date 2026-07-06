import { created, handleRouteError, ok } from "@/lib/api";
import { requireUser } from "@/lib/rbac";
import { createUserSchema } from "@/lib/validations";
import { createUser, listUsers } from "@/services/user-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    return ok(await listUsers(user));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const input = createUserSchema.parse(await request.json());
    return created(await createUser(user, input));
  } catch (error) {
    return handleRouteError(error);
  }
}

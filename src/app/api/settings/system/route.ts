import { handleRouteError, ok } from "@/lib/api";
import { requireUser } from "@/lib/rbac";
import { systemSettingsSchema } from "@/lib/validations";
import {
  getSystemSettings,
  updateSystemSettings
} from "@/services/settings-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    return ok(await getSystemSettings(user));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireUser();
    const input = systemSettingsSchema.parse(await request.json());
    return ok(await updateSystemSettings(user, input));
  } catch (error) {
    return handleRouteError(error);
  }
}

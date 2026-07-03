import { created, handleRouteError } from "@/lib/api";
import { requireUser } from "@/lib/rbac";
import { importCustomersFromCsv } from "@/services/customer-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new Error("Missing file");
    }

    const result = await importCustomersFromCsv(user, await file.text());
    return created(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

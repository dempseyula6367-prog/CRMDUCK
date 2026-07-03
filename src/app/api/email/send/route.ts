import { created, handleRouteError } from "@/lib/api";
import { assertRateLimit } from "@/lib/rate-limit";
import { requireUser } from "@/lib/rbac";
import { emailSchema } from "@/lib/validations";
import { enqueueCustomerEmail } from "@/services/email-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    assertRateLimit(`email:${user.id}`, 30, 60_000);
    const input = emailSchema.parse(await request.json());
    return created(await enqueueCustomerEmail(user, input));
  } catch (error) {
    return handleRouteError(error);
  }
}

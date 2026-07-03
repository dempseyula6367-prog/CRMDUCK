import { handleRouteError, ok } from "@/lib/api";
import { assertRateLimit } from "@/lib/rate-limit";
import { handleZaloWebhook } from "@/services/zalo-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertRateLimit("zalo:webhook", 300, 60_000);
    const secret = request.headers.get("x-zalo-secret");
    const result = await handleZaloWebhook(await request.json(), secret);

    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

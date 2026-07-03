import { ok, handleRouteError } from "@/lib/api";
import { assertRateLimit } from "@/lib/rate-limit";
import { forgotPasswordSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const key =
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip") ??
      "forgot-password";
    assertRateLimit(`forgot-password:${key}`, 5, 60_000);
    forgotPasswordSchema.parse(await request.json());

    return ok({
      message:
        "Neu email ton tai trong he thong, huong dan dat lai mat khau se duoc gui."
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

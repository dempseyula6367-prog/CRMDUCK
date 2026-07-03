import { ok } from "@/lib/api";
import { emailTemplates } from "@/services/email-service";

export const dynamic = "force-dynamic";

export async function GET() {
  return ok(emailTemplates);
}

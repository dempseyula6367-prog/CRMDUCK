import { CustomerStatus } from "@prisma/client";
import { created, handleRouteError, ok } from "@/lib/api";
import { requireUser } from "@/lib/rbac";
import { customerSchema } from "@/lib/validations";
import {
  createCustomer,
  listCustomers
} from "@/services/customer-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);

    const result = await listCustomers(user, {
      search: url.searchParams.get("search") ?? undefined,
      status: (url.searchParams.get("status") as CustomerStatus | null) ?? undefined,
      source: url.searchParams.get("source") ?? undefined,
      tag: url.searchParams.get("tag") ?? undefined,
      assignedToUserId: url.searchParams.get("assignedToUserId") ?? undefined,
      page: Number(url.searchParams.get("page") ?? 1),
      pageSize: Number(url.searchParams.get("pageSize") ?? 20)
    });

    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const input = customerSchema.parse(await request.json());
    const customer = await createCustomer(user, input);

    return created(customer);
  } catch (error) {
    return handleRouteError(error);
  }
}

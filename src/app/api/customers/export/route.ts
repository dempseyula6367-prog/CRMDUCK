import { handleRouteError } from "@/lib/api";
import { toCsv } from "@/lib/csv";
import { requireUser } from "@/lib/rbac";
import { listCustomers } from "@/services/customer-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    const result = await listCustomers(user, { page: 1, pageSize: 1000 });
    const csv = toCsv(
      result.items.map((customer) => ({
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        company: customer.company,
        source: customer.source,
        status: customer.status,
        tags: customer.tags.join("|")
      }))
    );

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="customers.csv"'
      }
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

import { empty, handleRouteError, ok } from "@/lib/api";
import { requireUser } from "@/lib/rbac";
import { customerSchema } from "@/lib/validations";
import {
  deleteCustomer,
  getCustomer,
  updateCustomer
} from "@/services/customer-service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    return ok(await getCustomer(user, params.id));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const input = customerSchema.parse(await request.json());
    return ok(await updateCustomer(user, params.id, input));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    await deleteCustomer(user, params.id);
    return empty();
  } catch (error) {
    return handleRouteError(error);
  }
}

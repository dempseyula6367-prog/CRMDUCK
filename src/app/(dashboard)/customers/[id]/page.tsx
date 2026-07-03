import { CustomerDetailClient } from "@/components/crm/customer-detail-client";

export default function CustomerDetailPage({
  params
}: {
  params: { id: string };
}) {
  return <CustomerDetailClient customerId={params.id} />;
}

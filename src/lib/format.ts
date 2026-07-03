export function formatCurrency(value: number | string) {
  const number = typeof value === "string" ? Number(value) : value;

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(Number.isFinite(number) ? number : 0);
}

export function formatDate(value?: string | Date | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium"
  }).format(new Date(value));
}

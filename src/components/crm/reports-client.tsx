"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Surface } from "@/components/ui/surface";
import { apiFetch } from "@/lib/client-api";
import { formatCurrency } from "@/lib/format";
import type { PipelineStats } from "@/types/crm";

type DashboardMetrics = {
  kpis: {
    newCustomers: number;
    openDeals: number;
    wonRevenue: number;
    overdueTasks: number;
    conversionRate: number;
  };
  sourceBreakdown: { source: string; count: number }[];
  pipeline: PipelineStats;
};

export function ReportsClient() {
  const { data } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: () => apiFetch<DashboardMetrics>("/api/dashboard/metrics")
  });

  return (
    <div>
      <PageHeader
        title="Báo cáo"
        description="Doanh số, chuyển đổi và nguồn khách hàng."
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Surface className="p-4">
          <h2 className="mb-4 text-base font-semibold">Giá trị pipeline</h2>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.pipeline.byStage ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="stage" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => formatCurrency(String(value))} />
                <Bar dataKey="totalValue" fill="#0f766e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Surface>

        <div className="space-y-5">
          <Surface className="p-4">
            <h2 className="mb-4 text-base font-semibold">Chỉ số</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Khách mới</span>
                <span className="font-medium">{data?.kpis.newCustomers ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deal mở</span>
                <span className="font-medium">{data?.kpis.openDeals ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Doanh số thắng</span>
                <span className="font-medium">
                  {formatCurrency(data?.kpis.wonRevenue ?? 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Conversion</span>
                <span className="font-medium">
                  {(data?.kpis.conversionRate ?? 0).toFixed(1)}%
                </span>
              </div>
            </div>
          </Surface>

          <Surface className="p-4">
            <h2 className="mb-4 text-base font-semibold">Nguồn khách</h2>
            <div className="space-y-2">
              {(data?.sourceBreakdown ?? []).map((source) => (
                <div
                  key={source.source}
                  className="flex items-center justify-between rounded-md border border-border p-2 text-sm"
                >
                  <span>{source.source}</span>
                  <Badge tone="primary">{source.count}</Badge>
                </div>
              ))}
            </div>
          </Surface>
        </div>
      </div>
    </div>
  );
}

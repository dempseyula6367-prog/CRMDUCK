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

export function DashboardClient() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: () => apiFetch<DashboardMetrics>("/api/dashboard/metrics")
  });

  const kpis = [
    {
      label: "Khách mới tháng này",
      value: data?.kpis.newCustomers ?? 0
    },
    {
      label: "Deal đang mở",
      value: data?.kpis.openDeals ?? 0
    },
    {
      label: "Doanh số thắng",
      value: formatCurrency(data?.kpis.wonRevenue ?? 0)
    },
    {
      label: "Task quá hạn",
      value: data?.kpis.overdueTasks ?? 0
    },
    {
      label: "Tỷ lệ chuyển đổi",
      value: `${(data?.kpis.conversionRate ?? 0).toFixed(1)}%`
    }
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Tổng quan khách hàng, pipeline và việc cần xử lý."
      />

      {error ? (
        <Surface className="mb-4 p-4 text-sm text-danger">
          Không tải được dashboard.
        </Surface>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map((item) => (
          <Surface key={item.label} className="p-4">
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold">
              {isLoading ? "..." : item.value}
            </p>
          </Surface>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Surface className="p-4">
          <div className="mb-4">
            <h2 className="text-base font-semibold">Pipeline theo stage</h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.pipeline.byStage ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="stage" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(value) => formatCurrency(String(value))}
                  cursor={{ fill: "rgba(20, 184, 166, 0.08)" }}
                />
                <Bar dataKey="totalValue" fill="#0f766e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="weightedValue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Surface>

        <Surface className="p-4">
          <div className="mb-4">
            <h2 className="text-base font-semibold">Nguồn khách hàng</h2>
          </div>
          <div className="space-y-3">
            {(data?.sourceBreakdown ?? []).map((source) => (
              <div key={source.source}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{source.source}</span>
                  <span className="font-medium">{source.count}</span>
                </div>
                <div className="h-2 rounded bg-muted">
                  <div
                    className="h-2 rounded bg-primary"
                    style={{
                      width: `${Math.min(source.count * 12, 100)}%`
                    }}
                  />
                </div>
              </div>
            ))}
            {!isLoading && data?.sourceBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>
            ) : null}
          </div>
        </Surface>
      </div>
    </div>
  );
}

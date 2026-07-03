"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Surface } from "@/components/ui/surface";
import { apiFetch } from "@/lib/client-api";
import { formatCurrency, formatDate } from "@/lib/format";
import type {
  CustomerListResponse,
  Deal,
  DealStage,
  PipelineStats
} from "@/types/crm";

const stages: { id: DealStage; label: string }[] = [
  { id: "NEW", label: "New" },
  { id: "NEGOTIATION", label: "Negotiation" },
  { id: "WON", label: "Won" },
  { id: "LOST", label: "Lost" }
];

type DealsResponse = {
  items: Deal[];
  stats: PipelineStats;
};

export function PipelineClient() {
  const queryClient = useQueryClient();
  const [draggingDealId, setDraggingDealId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    value: "",
    customerId: "",
    stage: "NEW",
    probability: "20",
    expectedCloseDate: ""
  });

  const dealsQuery = useQuery({
    queryKey: ["deals"],
    queryFn: () => apiFetch<DealsResponse>("/api/deals")
  });

  const customersQuery = useQuery({
    queryKey: ["customers", "deal-select"],
    queryFn: () => apiFetch<CustomerListResponse>("/api/customers?pageSize=100")
  });

  const updateStageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: DealStage }) =>
      apiFetch<Deal>(`/api/deals/${id}/stage`, {
        method: "PATCH",
        body: JSON.stringify({ stage })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    }
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiFetch<Deal>("/api/deals", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          value: Number(form.value),
          probability: Number(form.probability)
        })
      }),
    onSuccess: () => {
      setForm({
        title: "",
        value: "",
        customerId: "",
        stage: "NEW",
        probability: "20",
        expectedCloseDate: ""
      });
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    }
  });

  function dealsByStage(stage: DealStage) {
    return (dealsQuery.data?.items ?? []).filter((deal) => deal.stage === stage);
  }

  function onDrop(stage: DealStage) {
    if (!draggingDealId) return;
    updateStageMutation.mutate({ id: draggingDealId, stage });
    setDraggingDealId(null);
  }

  return (
    <div>
      <PageHeader
        title="Sales Pipeline"
        description="Theo dõi cơ hội bán hàng theo từng stage."
        actions={
          <Button type="button" onClick={() => setShowForm((value) => !value)}>
            <Plus className="h-4 w-4" />
            Deal mới
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Surface className="p-4">
          <p className="text-sm text-muted-foreground">Pipeline đang mở</p>
          <p className="mt-2 text-xl font-semibold">
            {formatCurrency(dealsQuery.data?.stats.totalOpenValue ?? 0)}
          </p>
        </Surface>
        <Surface className="p-4">
          <p className="text-sm text-muted-foreground">Won tháng này</p>
          <p className="mt-2 text-xl font-semibold">
            {formatCurrency(dealsQuery.data?.stats.totalWonValue ?? 0)}
          </p>
        </Surface>
        <Surface className="p-4">
          <p className="text-sm text-muted-foreground">Conversion</p>
          <p className="mt-2 text-xl font-semibold">
            {(dealsQuery.data?.stats.conversionRate ?? 0).toFixed(1)}%
          </p>
        </Surface>
      </div>

      {showForm ? (
        <Surface className="mb-4 p-4">
          <form
            className="grid gap-4 lg:grid-cols-6"
            onSubmit={(event) => {
              event.preventDefault();
              createMutation.mutate();
            }}
          >
            <div className="space-y-2 lg:col-span-2">
              <Label>Tiêu đề</Label>
              <Input
                value={form.title}
                onChange={(event) =>
                  setForm((value) => ({ ...value, title: event.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Giá trị</Label>
              <Input
                type="number"
                value={form.value}
                onChange={(event) =>
                  setForm((value) => ({ ...value, value: event.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Xác suất</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={form.probability}
                onChange={(event) =>
                  setForm((value) => ({
                    ...value,
                    probability: event.target.value
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Stage</Label>
              <Select
                value={form.stage}
                onChange={(event) =>
                  setForm((value) => ({ ...value, stage: event.target.value }))
                }
              >
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ngày chốt dự kiến</Label>
              <Input
                type="date"
                value={form.expectedCloseDate}
                onChange={(event) =>
                  setForm((value) => ({
                    ...value,
                    expectedCloseDate: event.target.value
                  }))
                }
              />
            </div>
            <div className="space-y-2 lg:col-span-3">
              <Label>Khách hàng</Label>
              <Select
                value={form.customerId}
                onChange={(event) =>
                  setForm((value) => ({ ...value, customerId: event.target.value }))
                }
                required
              >
                <option value="">Chọn khách hàng</option>
                {(customersQuery.data?.items ?? []).map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-end gap-2 lg:col-span-3">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Đang lưu..." : "Lưu deal"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Hủy
              </Button>
            </div>
          </form>
        </Surface>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-4">
        {stages.map((stage) => {
          const deals = dealsByStage(stage.id);

          return (
            <section
              key={stage.id}
              className="min-h-[420px] rounded-lg border border-border bg-muted/50 p-3"
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => onDrop(stage.id)}
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">{stage.label}</h2>
                <Badge>{deals.length}</Badge>
              </div>
              <div className="space-y-3">
                {deals.map((deal) => (
                  <Surface
                    key={deal.id}
                    className="cursor-grab p-3 active:cursor-grabbing"
                    draggable
                    onDragStart={() => setDraggingDealId(deal.id)}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{deal.title}</p>
                        <Link
                          href={`/customers/${deal.customerId}`}
                          className="text-sm text-primary"
                        >
                          {deal.customer?.name ?? "Khách hàng"}
                        </Link>
                      </div>
                      <Badge tone={deal.stage === "WON" ? "success" : "neutral"}>
                        {deal.probability}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">
                        {formatCurrency(deal.value)}
                      </span>
                      <span className="text-muted-foreground">
                        {formatDate(deal.expectedCloseDate)}
                      </span>
                    </div>
                  </Surface>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

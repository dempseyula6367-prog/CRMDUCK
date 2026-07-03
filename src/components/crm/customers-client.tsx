"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Plus, Search, Upload } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Surface } from "@/components/ui/surface";
import { apiFetch } from "@/lib/client-api";
import { formatDate } from "@/lib/format";
import type { Customer, CustomerListResponse, CustomerStatus, UserLite } from "@/types/crm";

const customerFormSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().optional(),
  company: z.string().optional(),
  source: z.string().optional(),
  tags: z.string().optional(),
  status: z.enum(["LEAD", "CONTACTED", "QUALIFIED", "CUSTOMER", "CHURNED"]),
  assignedToUserId: z.string().optional()
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

const statuses: CustomerStatus[] = [
  "LEAD",
  "CONTACTED",
  "QUALIFIED",
  "CUSTOMER",
  "CHURNED"
];

function statusTone(status: CustomerStatus) {
  if (status === "CUSTOMER") return "success";
  if (status === "QUALIFIED") return "primary";
  if (status === "CHURNED") return "danger";
  if (status === "CONTACTED") return "warning";
  return "neutral";
}

export function CustomersClient() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const customersQuery = useQuery({
    queryKey: ["customers", search, status],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      return apiFetch<CustomerListResponse>(`/api/customers?${params.toString()}`);
    }
  });

  const usersQuery = useQuery({
    queryKey: ["settings-users"],
    queryFn: () => apiFetch<UserLite[]>("/api/settings/users")
  });

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      company: "",
      source: "",
      tags: "",
      status: "LEAD",
      assignedToUserId: ""
    }
  });

  const createMutation = useMutation({
    mutationFn: (values: CustomerFormValues) =>
      apiFetch<Customer>("/api/customers", {
        method: "POST",
        body: JSON.stringify(values)
      }),
    onSuccess: () => {
      form.reset();
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    }
  });

  const importMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiFetch<{ imported: number; skipped: number }>("/api/customers/import", {
        method: "POST",
        body: formData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    }
  });

  function submit(values: CustomerFormValues) {
    createMutation.mutate(values);
  }

  function onImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) importMutation.mutate(file);
    event.target.value = "";
  }

  return (
    <div>
      <PageHeader
        title="Khách hàng"
        description="Quản lý lead, contact, tag, nguồn và người phụ trách."
        actions={
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={onImport}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                window.location.href = "/api/customers/export";
              }}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button type="button" onClick={() => setShowForm((value) => !value)}>
              <Plus className="h-4 w-4" />
              Khách mới
            </Button>
          </>
        }
      />

      <Surface className="mb-4 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
              placeholder="Tìm theo tên, email, SĐT, công ty"
            />
          </div>
          <Select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Tất cả trạng thái</option>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </div>
      </Surface>

      {showForm ? (
        <Surface className="mb-4 p-4">
          <form className="grid gap-4 lg:grid-cols-4" onSubmit={form.handleSubmit(submit)}>
            <div className="space-y-2">
              <Label>Tên khách hàng</Label>
              <Input {...form.register("name")} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" {...form.register("email")} />
            </div>
            <div className="space-y-2">
              <Label>Số điện thoại</Label>
              <Input {...form.register("phone")} />
            </div>
            <div className="space-y-2">
              <Label>Công ty</Label>
              <Input {...form.register("company")} />
            </div>
            <div className="space-y-2">
              <Label>Nguồn</Label>
              <Input placeholder="Facebook Ads, Zalo..." {...form.register("source")} />
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <Input placeholder="VIP, B2B" {...form.register("tags")} />
            </div>
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select {...form.register("status")}>
                {statuses.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Phụ trách</Label>
              <Select {...form.register("assignedToUserId")}>
                <option value="">Tự động</option>
                {(usersQuery.data ?? []).map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name ?? user.email}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-end gap-2 lg:col-span-4">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Đang lưu..." : "Lưu khách hàng"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowForm(false)}
              >
                Hủy
              </Button>
              {createMutation.error ? (
                <span className="text-sm text-danger">
                  {createMutation.error.message}
                </span>
              ) : null}
            </div>
          </form>
        </Surface>
      ) : null}

      <Surface className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Khách hàng</th>
                <th className="px-4 py-3 font-medium">Liên hệ</th>
                <th className="px-4 py-3 font-medium">Nguồn</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium">Phụ trách</th>
                <th className="px-4 py-3 font-medium">Cập nhật</th>
              </tr>
            </thead>
            <tbody>
              {(customersQuery.data?.items ?? []).map((customer) => (
                <tr key={customer.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <Link
                      href={`/customers/${customer.id}`}
                      className="font-medium text-primary"
                    >
                      {customer.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {customer.company ?? "Không có công ty"}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {customer.tags.map((tag) => (
                        <Badge key={tag}>{tag}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div>{customer.email ?? "-"}</div>
                    <div>{customer.phone ?? "-"}</div>
                  </td>
                  <td className="px-4 py-3">{customer.source ?? "-"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(customer.status)}>{customer.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {customer.assignedTo?.name ?? customer.assignedTo?.email ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(customer.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!customersQuery.isLoading && customersQuery.data?.items.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">Chưa có khách hàng.</div>
        ) : null}
      </Surface>
    </div>
  );
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Surface } from "@/components/ui/surface";
import { apiFetch } from "@/lib/client-api";
import { formatDate } from "@/lib/format";
import type {
  CustomerListResponse,
  Task,
  TaskPriority,
  TaskStatus,
  UserLite
} from "@/types/crm";

const statuses: TaskStatus[] = ["TODO", "DOING", "DONE"];
const priorities: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

function priorityTone(priority: TaskPriority) {
  if (priority === "URGENT") return "danger";
  if (priority === "HIGH") return "warning";
  if (priority === "MEDIUM") return "primary";
  return "neutral";
}

export function TasksClient() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "MEDIUM",
    assignedToUserId: "",
    relatedCustomerId: ""
  });

  const tasksQuery = useQuery({
    queryKey: ["tasks", statusFilter],
    queryFn: () => {
      const params = statusFilter ? `?status=${statusFilter}` : "";
      return apiFetch<Task[]>(`/api/tasks${params}`);
    }
  });

  const customersQuery = useQuery({
    queryKey: ["customers", "task-select"],
    queryFn: () => apiFetch<CustomerListResponse>("/api/customers?pageSize=100")
  });

  const usersQuery = useQuery({
    queryKey: ["settings-users"],
    queryFn: () => apiFetch<UserLite[]>("/api/settings/users")
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiFetch<Task>("/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          status: "TODO"
        })
      }),
    onSuccess: () => {
      setForm({
        title: "",
        description: "",
        dueDate: "",
        priority: "MEDIUM",
        assignedToUserId: "",
        relatedCustomerId: ""
      });
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ task, status }: { task: Task; status: TaskStatus }) =>
      apiFetch<Task>(`/api/tasks/${task.id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: task.title,
          description: task.description ?? "",
          dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
          status,
          priority: task.priority,
          assignedToUserId: task.assignedToUserId ?? "",
          relatedCustomerId: task.relatedCustomerId ?? ""
        })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    }
  });

  return (
    <div>
      <PageHeader
        title="Công việc"
        description="Theo dõi follow-up, deadline và lịch chăm sóc khách hàng."
        actions={
          <Button type="button" onClick={() => setShowForm((value) => !value)}>
            <Plus className="h-4 w-4" />
            Task mới
          </Button>
        }
      />

      <Surface className="mb-4 p-4">
        <div className="w-full max-w-xs">
          <Select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
        </div>
      </Surface>

      {showForm ? (
        <Surface className="mb-4 p-4">
          <form
            className="grid gap-4 lg:grid-cols-4"
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
              <Label>Deadline</Label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(event) =>
                  setForm((value) => ({ ...value, dueDate: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Ưu tiên</Label>
              <Select
                value={form.priority}
                onChange={(event) =>
                  setForm((value) => ({ ...value, priority: event.target.value }))
                }
              >
                {priorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label>Khách hàng</Label>
              <Select
                value={form.relatedCustomerId}
                onChange={(event) =>
                  setForm((value) => ({
                    ...value,
                    relatedCustomerId: event.target.value
                  }))
                }
              >
                <option value="">Không gắn khách hàng</option>
                {(customersQuery.data?.items ?? []).map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label>Phụ trách</Label>
              <Select
                value={form.assignedToUserId}
                onChange={(event) =>
                  setForm((value) => ({
                    ...value,
                    assignedToUserId: event.target.value
                  }))
                }
              >
                <option value="">Tự động</option>
                {(usersQuery.data ?? []).map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name ?? user.email}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2 lg:col-span-4">
              <Label>Mô tả</Label>
              <Textarea
                value={form.description}
                onChange={(event) =>
                  setForm((value) => ({
                    ...value,
                    description: event.target.value
                  }))
                }
              />
            </div>
            <div className="flex items-center gap-2 lg:col-span-4">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Đang lưu..." : "Lưu task"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Hủy
              </Button>
            </div>
          </form>
        </Surface>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        {statuses.map((status) => {
          const tasks = (tasksQuery.data ?? []).filter((task) => task.status === status);

          return (
            <Surface key={status} className="min-h-96 p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold">{status}</h2>
                <Badge>{tasks.length}</Badge>
              </div>
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="rounded-md border border-border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {task.relatedCustomer ? (
                            <Link
                              href={`/customers/${task.relatedCustomer.id}`}
                              className="text-primary"
                            >
                              {task.relatedCustomer.name}
                            </Link>
                          ) : (
                            "Không gắn khách hàng"
                          )}
                        </p>
                      </div>
                      <Badge tone={priorityTone(task.priority)}>{task.priority}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                      <span>Hạn: {formatDate(task.dueDate)}</span>
                      <Select
                        className="h-8 w-32"
                        value={task.status}
                        onChange={(event) =>
                          updateStatusMutation.mutate({
                            task,
                            status: event.target.value as TaskStatus
                          })
                        }
                      >
                        {statuses.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                ))}
                {!tasksQuery.isLoading && tasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Không có task.</p>
                ) : null}
              </div>
            </Surface>
          );
        })}
      </div>
    </div>
  );
}

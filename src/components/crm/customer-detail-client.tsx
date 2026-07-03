"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, MessageSquare, Phone, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Surface } from "@/components/ui/surface";
import { apiFetch } from "@/lib/client-api";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Activity, Customer, Deal, EmailLog, Task } from "@/types/crm";

type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
};

function activityIcon(type: Activity["type"]) {
  if (type === "CALL") return Phone;
  if (type === "EMAIL") return Mail;
  return MessageSquare;
}

export function CustomerDetailClient({ customerId }: { customerId: string }) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  const customerQuery = useQuery({
    queryKey: ["customer", customerId],
    queryFn: () => apiFetch<Customer>(`/api/customers/${customerId}`)
  });

  const templatesQuery = useQuery({
    queryKey: ["email-templates"],
    queryFn: () => apiFetch<EmailTemplate[]>("/api/email/templates")
  });

  const addNoteMutation = useMutation({
    mutationFn: () =>
      apiFetch<Activity>(`/api/customers/${customerId}/activities`, {
        method: "POST",
        body: JSON.stringify({ type: "NOTE", content: note })
      }),
    onSuccess: () => {
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["customer", customerId] });
    }
  });

  const sendEmailMutation = useMutation({
    mutationFn: () =>
      apiFetch<EmailLog>("/api/email/send", {
        method: "POST",
        body: JSON.stringify({
          customerId,
          subject: emailSubject,
          body: emailBody
        })
      }),
    onSuccess: () => {
      setEmailSubject("");
      setEmailBody("");
      queryClient.invalidateQueries({ queryKey: ["customer", customerId] });
    }
  });

  const customer = customerQuery.data;

  function applyTemplate(templateId: string) {
    const template = templatesQuery.data?.find((item) => item.id === templateId);
    if (!template || !customer) return;

    setEmailSubject(template.subject.replaceAll("{{customerName}}", customer.name));
    setEmailBody(template.body.replaceAll("{{customerName}}", customer.name));
  }

  return (
    <div>
      <PageHeader
        title={customer?.name ?? "Khách hàng"}
        description={customer?.company ?? customer?.email ?? ""}
        actions={
          <Link
            href="/customers"
            className="inline-flex h-10 items-center rounded-md border border-border bg-white px-4 text-sm font-medium shadow-sm hover:bg-muted"
          >
            Quay lại
          </Link>
        }
      />

      {customerQuery.error ? (
        <Surface className="p-4 text-sm text-danger">
          Không tải được khách hàng.
        </Surface>
      ) : null}

      {customer ? (
        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-5">
            <Surface className="p-4">
              <h2 className="mb-4 text-base font-semibold">Thông tin</h2>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="font-medium">{customer.email ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Số điện thoại</dt>
                  <dd className="font-medium">{customer.phone ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Nguồn</dt>
                  <dd className="font-medium">{customer.source ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Trạng thái</dt>
                  <dd>
                    <Badge tone="primary">{customer.status}</Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Phụ trách</dt>
                  <dd className="font-medium">
                    {customer.assignedTo?.name ?? customer.assignedTo?.email ?? "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Cập nhật</dt>
                  <dd className="font-medium">{formatDate(customer.updatedAt)}</dd>
                </div>
              </dl>
              <div className="mt-4 flex flex-wrap gap-2">
                {customer.tags.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
            </Surface>

            <Surface className="p-4">
              <h2 className="mb-4 text-base font-semibold">Ghi chú nhanh</h2>
              <div className="space-y-3">
                <Textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Nội dung ghi chú"
                />
                <Button
                  type="button"
                  disabled={!note.trim() || addNoteMutation.isPending}
                  onClick={() => addNoteMutation.mutate()}
                >
                  <Plus className="h-4 w-4" />
                  Thêm ghi chú
                </Button>
              </div>
            </Surface>

            <Surface className="p-4">
              <h2 className="mb-4 text-base font-semibold">Email</h2>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Mẫu email</Label>
                  <Select onChange={(event) => applyTemplate(event.target.value)}>
                    <option value="">Chọn mẫu</option>
                    {(templatesQuery.data ?? []).map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tiêu đề</Label>
                  <Input
                    value={emailSubject}
                    onChange={(event) => setEmailSubject(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nội dung</Label>
                  <Textarea
                    value={emailBody}
                    onChange={(event) => setEmailBody(event.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  disabled={
                    !emailSubject.trim() ||
                    !emailBody.trim() ||
                    sendEmailMutation.isPending
                  }
                  onClick={() => sendEmailMutation.mutate()}
                >
                  <Mail className="h-4 w-4" />
                  Gửi email
                </Button>
                {sendEmailMutation.error ? (
                  <p className="text-sm text-danger">{sendEmailMutation.error.message}</p>
                ) : null}
              </div>
            </Surface>
          </div>

          <div className="space-y-5">
            <Surface className="p-4">
              <h2 className="mb-4 text-base font-semibold">Deal liên quan</h2>
              <div className="space-y-3">
                {(customer.deals ?? []).map((deal: Deal) => (
                  <div
                    key={deal.id}
                    className="rounded-md border border-border p-3 text-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{deal.title}</p>
                        <p className="text-muted-foreground">
                          {formatCurrency(deal.value)}
                        </p>
                      </div>
                      <Badge tone="primary">{deal.stage}</Badge>
                    </div>
                  </div>
                ))}
                {customer.deals?.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Chưa có deal.</p>
                ) : null}
              </div>
            </Surface>

            <Surface className="p-4">
              <h2 className="mb-4 text-base font-semibold">Công việc</h2>
              <div className="space-y-3">
                {(customer.tasks ?? []).map((task: Task) => (
                  <div
                    key={task.id}
                    className="rounded-md border border-border p-3 text-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-muted-foreground">
                          Hạn: {formatDate(task.dueDate)}
                        </p>
                      </div>
                      <Badge>{task.status}</Badge>
                    </div>
                  </div>
                ))}
                {customer.tasks?.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Chưa có công việc.</p>
                ) : null}
              </div>
            </Surface>

            <Surface className="p-4">
              <h2 className="mb-4 text-base font-semibold">Timeline</h2>
              <div className="space-y-4">
                {(customer.activities ?? []).map((activity) => {
                  const Icon = activityIcon(activity.type);
                  return (
                    <div key={activity.id} className="flex gap-3 text-sm">
                      <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge>{activity.type}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(activity.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap">{activity.content}</p>
                      </div>
                    </div>
                  );
                })}
                {customer.activities?.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Chưa có tương tác.
                  </p>
                ) : null}
              </div>
            </Surface>
          </div>
        </div>
      ) : null}
    </div>
  );
}

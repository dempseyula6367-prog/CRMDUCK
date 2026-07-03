"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Surface } from "@/components/ui/surface";
import { apiFetch } from "@/lib/client-api";
import type { Role, UserLite } from "@/types/crm";

type SystemSettings = {
  customerSources: string[];
  customerTags: string[];
  stageLabels: {
    NEW: string;
    NEGOTIATION: string;
    WON: string;
    LOST: string;
  };
};

const roles: Role[] = ["ADMIN", "MANAGER", "SALES", "VIEWER"];

export function SettingsClient() {
  const queryClient = useQueryClient();
  const [settingsForm, setSettingsForm] = useState({
    customerSources: "",
    customerTags: "",
    newLabel: "",
    negotiationLabel: "",
    wonLabel: "",
    lostLabel: ""
  });

  const usersQuery = useQuery({
    queryKey: ["settings-users"],
    queryFn: () => apiFetch<UserLite[]>("/api/settings/users")
  });

  const settingsQuery = useQuery({
    queryKey: ["system-settings"],
    queryFn: () => apiFetch<SystemSettings>("/api/settings/system")
  });

  useEffect(() => {
    if (!settingsQuery.data) return;

    setSettingsForm({
      customerSources: settingsQuery.data.customerSources.join(", "),
      customerTags: settingsQuery.data.customerTags.join(", "),
      newLabel: settingsQuery.data.stageLabels.NEW,
      negotiationLabel: settingsQuery.data.stageLabels.NEGOTIATION,
      wonLabel: settingsQuery.data.stageLabels.WON,
      lostLabel: settingsQuery.data.stageLabels.LOST
    });
  }, [settingsQuery.data]);

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) =>
      apiFetch<UserLite>(`/api/settings/users/${id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-users"] });
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: () =>
      apiFetch<SystemSettings>("/api/settings/system", {
        method: "PUT",
        body: JSON.stringify({
          customerSources: splitList(settingsForm.customerSources),
          customerTags: splitList(settingsForm.customerTags),
          stageLabels: {
            NEW: settingsForm.newLabel,
            NEGOTIATION: settingsForm.negotiationLabel,
            WON: settingsForm.wonLabel,
            LOST: settingsForm.lostLabel
          }
        })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
    }
  });

  return (
    <div>
      <PageHeader
        title="Cài đặt"
        description="User, phân quyền và cấu hình CRM theo organization."
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <Surface className="overflow-hidden">
          <div className="border-b border-border p-4">
            <h2 className="text-base font-semibold">User & phân quyền</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Người dùng</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Đổi role</th>
                </tr>
              </thead>
              <tbody>
                {(usersQuery.data ?? []).map((user) => (
                  <tr key={user.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{user.name ?? "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {user.email ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={user.role === "ADMIN" ? "primary" : "neutral"}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        className="h-8 w-36"
                        value={user.role}
                        onChange={(event) =>
                          updateRoleMutation.mutate({
                            id: user.id,
                            role: event.target.value as Role
                          })
                        }
                      >
                        {roles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Surface>

        <Surface className="p-4">
          <h2 className="mb-4 text-base font-semibold">Cấu hình CRM</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nguồn khách</Label>
              <Input
                value={settingsForm.customerSources}
                onChange={(event) =>
                  setSettingsForm((value) => ({
                    ...value,
                    customerSources: event.target.value
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <Input
                value={settingsForm.customerTags}
                onChange={(event) =>
                  setSettingsForm((value) => ({
                    ...value,
                    customerTags: event.target.value
                  }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StageLabel
                label="NEW"
                value={settingsForm.newLabel}
                onChange={(newLabel) =>
                  setSettingsForm((value) => ({ ...value, newLabel }))
                }
              />
              <StageLabel
                label="NEGOTIATION"
                value={settingsForm.negotiationLabel}
                onChange={(negotiationLabel) =>
                  setSettingsForm((value) => ({ ...value, negotiationLabel }))
                }
              />
              <StageLabel
                label="WON"
                value={settingsForm.wonLabel}
                onChange={(wonLabel) =>
                  setSettingsForm((value) => ({ ...value, wonLabel }))
                }
              />
              <StageLabel
                label="LOST"
                value={settingsForm.lostLabel}
                onChange={(lostLabel) =>
                  setSettingsForm((value) => ({ ...value, lostLabel }))
                }
              />
            </div>
            <Button
              type="button"
              className="w-full"
              disabled={updateSettingsMutation.isPending}
              onClick={() => updateSettingsMutation.mutate()}
            >
              <Save className="h-4 w-4" />
              Lưu cấu hình
            </Button>
          </div>
        </Surface>
      </div>
    </div>
  );
}

function StageLabel({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

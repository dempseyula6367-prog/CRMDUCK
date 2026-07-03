import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CurrentUser } from "@/lib/rbac";
import { assertRole, requireOrganization } from "@/lib/rbac";
import type { SystemSettingsInput } from "@/lib/validations";
import { createAuditLog } from "@/services/audit-service";

export const defaultSystemSettings: SystemSettingsInput = {
  customerSources: ["Facebook Ads", "Zalo", "Referral", "Website"],
  customerTags: ["VIP", "B2B", "Hot lead"],
  stageLabels: {
    NEW: "New",
    NEGOTIATION: "Negotiation",
    WON: "Won",
    LOST: "Lost"
  }
};

export async function getSystemSettings(user: CurrentUser) {
  const organizationId = requireOrganization(user);
  const setting = await prisma.crmSetting.findUnique({
    where: {
      organizationId_key: {
        organizationId,
        key: "system"
      }
    }
  });

  if (!setting) return defaultSystemSettings;

  return {
    ...defaultSystemSettings,
    ...(setting.value as object)
  } as SystemSettingsInput;
}

export async function updateSystemSettings(
  user: CurrentUser,
  input: SystemSettingsInput
) {
  assertRole(user, [Role.ADMIN, Role.MANAGER]);
  const organizationId = requireOrganization(user);
  const before = await getSystemSettings(user);

  const setting = await prisma.crmSetting.upsert({
    where: {
      organizationId_key: {
        organizationId,
        key: "system"
      }
    },
    update: { value: input },
    create: {
      key: "system",
      value: input,
      organizationId
    }
  });

  await createAuditLog(user, {
    action: "SYSTEM_SETTINGS_UPDATED",
    entityType: "CrmSetting",
    entityId: setting.id,
    before,
    after: input
  });

  return input;
}

import { prisma } from "@/lib/prisma";
import type { CurrentUser } from "@/lib/rbac";
import { requireOrganization } from "@/lib/rbac";

type AuditInput = {
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
};

function toJson(value: unknown) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

export async function createAuditLog(user: CurrentUser, input: AuditInput) {
  const organizationId = requireOrganization(user);

  await prisma.auditLog.create({
    data: {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      before: toJson(input.before),
      after: toJson(input.after),
      actorUserId: user.id,
      organizationId
    }
  });
}

import { DealStage, Role } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { AppError } from "@/lib/api";
import { calculatePipelineSummary } from "@/lib/pipeline";
import { prisma } from "@/lib/prisma";
import type { DealInput } from "@/lib/validations";
import type { CurrentUser } from "@/lib/rbac";
import {
  assertCanReadAssignedResource,
  assertCanWrite,
  requireOrganization
} from "@/lib/rbac";
import { createAuditLog } from "@/services/audit-service";

function dealScope(user: CurrentUser): Prisma.DealWhereInput {
  const organizationId = requireOrganization(user);

  return {
    organizationId,
    deletedAt: null,
    ...(user.role === Role.SALES ? { assignedToUserId: user.id } : {})
  };
}

export async function listDeals(user: CurrentUser) {
  return prisma.deal.findMany({
    where: dealScope(user),
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          company: true,
          status: true
        }
      },
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: [{ stage: "asc" }, { updatedAt: "desc" }]
  });
}

export async function getDeal(user: CurrentUser, id: string) {
  const organizationId = requireOrganization(user);

  const deal = await prisma.deal.findFirst({
    where: { id, organizationId, deletedAt: null },
    include: {
      customer: true,
      assignedTo: { select: { id: true, name: true, email: true } }
    }
  });

  if (!deal) throw new AppError(404, "Khong tim thay deal.");

  assertCanReadAssignedResource(user, deal.assignedToUserId);
  return deal;
}

export async function createDeal(user: CurrentUser, input: DealInput) {
  assertCanWrite(user);
  const organizationId = requireOrganization(user);

  const customer = await prisma.customer.findFirst({
    where: { id: input.customerId, organizationId, deletedAt: null },
    select: { id: true, assignedToUserId: true }
  });

  if (!customer) throw new AppError(404, "Khong tim thay khach hang.");
  assertCanReadAssignedResource(user, customer.assignedToUserId);

  const assignedToUserId =
    user.role === Role.SALES
      ? user.id
      : input.assignedToUserId ?? customer.assignedToUserId ?? user.id;

  const created = await prisma.deal.create({
    data: {
      title: input.title,
      value: input.value,
      stage: input.stage,
      probability: input.probability,
      expectedCloseDate: input.expectedCloseDate
        ? new Date(input.expectedCloseDate)
        : null,
      customerId: input.customerId,
      assignedToUserId,
      organizationId
    },
    include: {
      customer: { select: { id: true, name: true, company: true, status: true } },
      assignedTo: { select: { id: true, name: true, email: true } }
    }
  });

  await createAuditLog(user, {
    action: "DEAL_CREATED",
    entityType: "Deal",
    entityId: created.id,
    after: created as Prisma.InputJsonValue
  });

  return created;
}

export async function updateDealStage(
  user: CurrentUser,
  id: string,
  stage: DealStage
) {
  assertCanWrite(user);
  const existing = await getDeal(user, id);

  const updated = await prisma.deal.update({
    where: { id },
    data: {
      stage,
      probability: stage === "WON" ? 100 : stage === "LOST" ? 0 : existing.probability
    },
    include: {
      customer: { select: { id: true, name: true, company: true, status: true } },
      assignedTo: { select: { id: true, name: true, email: true } }
    }
  });

  await prisma.activity.create({
    data: {
      type: "NOTE",
      content: `Deal "${updated.title}" moved to ${stage}.`,
      customerId: updated.customerId,
      userId: user.id,
      organizationId: requireOrganization(user)
    }
  });

  await createAuditLog(user, {
    action: "DEAL_STAGE_UPDATED",
    entityType: "Deal",
    entityId: id,
    before: { stage: existing.stage },
    after: { stage }
  });

  return updated;
}

export async function getPipelineStats(user: CurrentUser) {
  const deals = await prisma.deal.findMany({
    where: dealScope(user),
    select: {
      stage: true,
      value: true,
      probability: true
    }
  });

  return calculatePipelineSummary(deals);
}

export async function deleteDeal(user: CurrentUser, id: string) {
  assertCanWrite(user);
  const existing = await getDeal(user, id);

  await prisma.deal.update({
    where: { id },
    data: { deletedAt: new Date() }
  });

  await createAuditLog(user, {
    action: "DEAL_DELETED",
    entityType: "Deal",
    entityId: id,
    before: existing as Prisma.InputJsonValue
  });
}

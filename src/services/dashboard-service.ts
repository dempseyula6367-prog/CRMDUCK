import { DealStage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CurrentUser } from "@/lib/rbac";
import { ownerScopedWhere, requireOrganization } from "@/lib/rbac";
import { getPipelineStats } from "@/services/deal-service";

export async function getDashboardMetrics(user: CurrentUser) {
  const organizationId = requireOrganization(user);
  const scope = ownerScopedWhere(user);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [
    newCustomers,
    openDeals,
    wonDeals,
    overdueTasks,
    sourceGroups,
    pipeline
  ] = await Promise.all([
    prisma.customer.count({
      where: {
        ...scope,
        createdAt: { gte: monthStart },
        deletedAt: null
      }
    }),
    prisma.deal.count({
      where: {
        ...scope,
        stage: { in: [DealStage.NEW, DealStage.NEGOTIATION] },
        deletedAt: null
      }
    }),
    prisma.deal.aggregate({
      where: {
        ...scope,
        stage: DealStage.WON,
        updatedAt: { gte: monthStart },
        deletedAt: null
      },
      _sum: { value: true }
    }),
    prisma.task.count({
      where: {
        ...scope,
        dueDate: { lt: new Date() },
        status: { not: "DONE" },
        deletedAt: null
      }
    }),
    prisma.customer.groupBy({
      by: ["source"],
      where: {
        organizationId,
        deletedAt: null
      },
      _count: { _all: true },
      orderBy: { _count: { source: "desc" } },
      take: 8
    }),
    getPipelineStats(user)
  ]);

  return {
    kpis: {
      newCustomers,
      openDeals,
      wonRevenue: Number(wonDeals._sum.value ?? 0),
      overdueTasks,
      conversionRate: pipeline.conversionRate
    },
    sourceBreakdown: sourceGroups.map((item) => ({
      source: item.source ?? "Unknown",
      count: item._count._all
    })),
    pipeline
  };
}

import { CustomerStatus, Role } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { AppError } from "@/lib/api";
import { parseCsv } from "@/lib/csv";
import { prisma } from "@/lib/prisma";
import type { CustomerInput } from "@/lib/validations";
import { customerSchema } from "@/lib/validations";
import type { CurrentUser } from "@/lib/rbac";
import {
  assertCanReadAssignedResource,
  assertCanWrite,
  requireOrganization
} from "@/lib/rbac";
import { createAuditLog } from "@/services/audit-service";

export type CustomerListQuery = {
  search?: string;
  status?: CustomerStatus;
  source?: string;
  tag?: string;
  assignedToUserId?: string;
  page?: number;
  pageSize?: number;
};

function customerScope(user: CurrentUser): Prisma.CustomerWhereInput {
  const organizationId = requireOrganization(user);

  return {
    organizationId,
    deletedAt: null,
    ...(user.role === Role.SALES ? { assignedToUserId: user.id } : {})
  };
}

function customerSelect() {
  return {
    assignedTo: {
      select: {
        id: true,
        name: true,
        email: true
      }
    },
    _count: {
      select: {
        deals: true,
        activities: true,
        tasks: true
      }
    }
  } satisfies Prisma.CustomerInclude;
}

export async function listCustomers(
  user: CurrentUser,
  query: CustomerListQuery
) {
  const page = Math.max(query.page ?? 1, 1);
  const pageSize = Math.min(Math.max(query.pageSize ?? 20, 5), 100);

  const where: Prisma.CustomerWhereInput = {
    ...customerScope(user),
    ...(query.status ? { status: query.status } : {}),
    ...(query.source ? { source: query.source } : {}),
    ...(query.tag ? { tags: { has: query.tag } } : {}),
    ...(query.assignedToUserId && user.role !== Role.SALES
      ? { assignedToUserId: query.assignedToUserId }
      : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" } },
            { email: { contains: query.search, mode: "insensitive" } },
            { phone: { contains: query.search, mode: "insensitive" } },
            { company: { contains: query.search, mode: "insensitive" } }
          ]
        }
      : {})
  };

  const [items, total] = await prisma.$transaction([
    prisma.customer.findMany({
      where,
      include: customerSelect(),
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.customer.count({ where })
  ]);

  return {
    items,
    meta: {
      page,
      pageSize,
      total,
      pageCount: Math.ceil(total / pageSize)
    }
  };
}

export async function getCustomer(user: CurrentUser, id: string) {
  const organizationId = requireOrganization(user);

  const customer = await prisma.customer.findFirst({
    where: { id, organizationId, deletedAt: null },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      deals: {
        where: { deletedAt: null },
        orderBy: { updatedAt: "desc" },
        include: {
          assignedTo: { select: { id: true, name: true } }
        }
      },
      activities: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true, email: true } } }
      },
      tasks: {
        where: { deletedAt: null },
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }]
      },
      emailLogs: {
        orderBy: { createdAt: "desc" },
        take: 20
      },
      zaloIntegration: true
    }
  });

  if (!customer) throw new AppError(404, "Khong tim thay khach hang.");

  assertCanReadAssignedResource(user, customer.assignedToUserId);
  return customer;
}

export async function createCustomer(user: CurrentUser, input: CustomerInput) {
  assertCanWrite(user);
  const organizationId = requireOrganization(user);

  const assignedToUserId =
    user.role === Role.SALES ? user.id : input.assignedToUserId ?? user.id;

  const created = await prisma.customer.create({
    data: {
      name: input.name,
      phone: input.phone,
      email: input.email,
      company: input.company,
      address: input.address,
      source: input.source,
      tags: input.tags,
      status: input.status,
      assignedToUserId,
      organizationId
    },
    include: customerSelect()
  });

  await createAuditLog(user, {
    action: "CUSTOMER_CREATED",
    entityType: "Customer",
    entityId: created.id,
    after: created as Prisma.InputJsonValue
  });

  return created;
}

export async function updateCustomer(
  user: CurrentUser,
  id: string,
  input: CustomerInput
) {
  assertCanWrite(user);
  const existing = await getCustomer(user, id);

  const updated = await prisma.customer.update({
    where: { id },
    data: {
      name: input.name,
      phone: input.phone,
      email: input.email,
      company: input.company,
      address: input.address,
      source: input.source,
      tags: input.tags,
      status: input.status,
      assignedToUserId:
        user.role === Role.SALES
          ? existing.assignedToUserId
          : input.assignedToUserId ?? null
    },
    include: customerSelect()
  });

  await createAuditLog(user, {
    action: "CUSTOMER_UPDATED",
    entityType: "Customer",
    entityId: updated.id,
    before: existing as Prisma.InputJsonValue,
    after: updated as Prisma.InputJsonValue
  });

  return updated;
}

export async function deleteCustomer(user: CurrentUser, id: string) {
  assertCanWrite(user);
  const existing = await getCustomer(user, id);

  await prisma.customer.update({
    where: { id },
    data: { deletedAt: new Date() }
  });

  await createAuditLog(user, {
    action: "CUSTOMER_DELETED",
    entityType: "Customer",
    entityId: id,
    before: existing as Prisma.InputJsonValue
  });
}

export async function addCustomerActivity(
  user: CurrentUser,
  customerId: string,
  input: { type: "CALL" | "EMAIL" | "ZALO" | "MEETING" | "NOTE"; content: string }
) {
  assertCanWrite(user);
  const organizationId = requireOrganization(user);
  await getCustomer(user, customerId);

  return prisma.activity.create({
    data: {
      type: input.type,
      content: input.content,
      customerId,
      userId: user.id,
      organizationId
    },
    include: {
      user: { select: { id: true, name: true, email: true } }
    }
  });
}

export async function importCustomersFromCsv(user: CurrentUser, csvText: string) {
  assertCanWrite(user);
  const rows = parseCsv(csvText);
  const results = [];

  for (const row of rows) {
    const parsed = customerSchema.safeParse({
      name: row.name,
      phone: row.phone,
      email: row.email,
      company: row.company,
      address: row.address,
      source: row.source,
      tags: row.tags,
      status: row.status || "LEAD",
      assignedToUserId: row.assignedToUserId
    });

    if (parsed.success) {
      results.push(await createCustomer(user, parsed.data));
    }
  }

  return {
    imported: results.length,
    skipped: rows.length - results.length
  };
}

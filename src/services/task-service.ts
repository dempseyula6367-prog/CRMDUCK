import { Role, TaskStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { AppError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import type { TaskInput } from "@/lib/validations";
import type { CurrentUser } from "@/lib/rbac";
import {
  assertCanReadAssignedResource,
  assertCanWrite,
  requireOrganization
} from "@/lib/rbac";
import { createAuditLog } from "@/services/audit-service";

function taskScope(user: CurrentUser): Prisma.TaskWhereInput {
  const organizationId = requireOrganization(user);

  return {
    organizationId,
    deletedAt: null,
    ...(user.role === Role.SALES ? { assignedToUserId: user.id } : {})
  };
}

export async function listTasks(user: CurrentUser, status?: TaskStatus) {
  return prisma.task.findMany({
    where: {
      ...taskScope(user),
      ...(status ? { status } : {})
    },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      relatedCustomer: { select: { id: true, name: true, company: true } }
    },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }]
  });
}

export async function getTask(user: CurrentUser, id: string) {
  const organizationId = requireOrganization(user);
  const task = await prisma.task.findFirst({
    where: { id, organizationId, deletedAt: null },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      relatedCustomer: { select: { id: true, name: true, company: true } }
    }
  });

  if (!task) throw new AppError(404, "Khong tim thay cong viec.");
  assertCanReadAssignedResource(user, task.assignedToUserId);

  return task;
}

export async function createTask(user: CurrentUser, input: TaskInput) {
  assertCanWrite(user);
  const organizationId = requireOrganization(user);
  const assignedToUserId =
    user.role === Role.SALES ? user.id : input.assignedToUserId ?? user.id;

  const created = await prisma.task.create({
    data: {
      title: input.title,
      description: input.description,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      status: input.status,
      priority: input.priority,
      assignedToUserId,
      relatedCustomerId: input.relatedCustomerId,
      organizationId
    },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      relatedCustomer: { select: { id: true, name: true, company: true } }
    }
  });

  await createAuditLog(user, {
    action: "TASK_CREATED",
    entityType: "Task",
    entityId: created.id,
    after: created as Prisma.InputJsonValue
  });

  return created;
}

export async function updateTask(user: CurrentUser, id: string, input: TaskInput) {
  assertCanWrite(user);
  const existing = await getTask(user, id);

  const updated = await prisma.task.update({
    where: { id },
    data: {
      title: input.title,
      description: input.description,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      status: input.status,
      priority: input.priority,
      assignedToUserId:
        user.role === Role.SALES
          ? existing.assignedToUserId
          : input.assignedToUserId ?? null,
      relatedCustomerId: input.relatedCustomerId
    },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      relatedCustomer: { select: { id: true, name: true, company: true } }
    }
  });

  await createAuditLog(user, {
    action: "TASK_UPDATED",
    entityType: "Task",
    entityId: id,
    before: existing as Prisma.InputJsonValue,
    after: updated as Prisma.InputJsonValue
  });

  return updated;
}

export async function deleteTask(user: CurrentUser, id: string) {
  assertCanWrite(user);
  const existing = await getTask(user, id);

  await prisma.task.update({
    where: { id },
    data: { deletedAt: new Date() }
  });

  await createAuditLog(user, {
    action: "TASK_DELETED",
    entityType: "Task",
    entityId: id,
    before: existing as Prisma.InputJsonValue
  });
}

import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { AppError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import type { CurrentUser } from "@/lib/rbac";
import {
  assertCanManageUsers,
  requireOrganization
} from "@/lib/rbac";
import { createAuditLog } from "@/services/audit-service";

export async function listUsers(user: CurrentUser) {
  const organizationId = requireOrganization(user);

  return prisma.user.findMany({
    where: {
      organizationId,
      deletedAt: null
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true
    },
    orderBy: [{ role: "asc" }, { name: "asc" }]
  });
}

export async function createUser(
  actor: CurrentUser,
  input: {
    name: string;
    email: string;
    password: string;
    role: Role;
  }
) {
  assertCanManageUsers(actor);
  const organizationId = requireOrganization(actor);
  const email = input.email.toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true }
  });

  if (existing) {
    throw new AppError(409, "Email này đã có tài khoản trong hệ thống.");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const created = await prisma.user.create({
    data: {
      name: input.name,
      email,
      passwordHash,
      role: input.role,
      organizationId
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true
    }
  });

  await createAuditLog(actor, {
    action: "USER_CREATED",
    entityType: "User",
    entityId: created.id,
    after: {
      name: created.name,
      email: created.email,
      role: created.role
    }
  });

  return created;
}

export async function updateUserRole(
  actor: CurrentUser,
  userId: string,
  role: Role
) {
  assertCanManageUsers(actor);
  const organizationId = requireOrganization(actor);

  if (actor.id === userId && role !== Role.ADMIN) {
    throw new AppError(400, "Admin khong the tu ha quyen cua chinh minh.");
  }

  const existing = await prisma.user.findFirst({
    where: { id: userId, organizationId, deletedAt: null }
  });

  if (!existing) {
    throw new AppError(404, "Khong tim thay nguoi dung.");
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  });

  await createAuditLog(actor, {
    action: "USER_ROLE_UPDATED",
    entityType: "User",
    entityId: userId,
    before: { role: existing.role },
    after: { role }
  });

  return updated;
}

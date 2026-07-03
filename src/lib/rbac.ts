import { getServerSession } from "next-auth";
import { Role } from "@prisma/client";
import { AppError } from "@/lib/api";
import { authOptions } from "@/lib/auth";

export type CurrentUser = {
  id: string;
  role: Role;
  organizationId: string | null;
  email?: string | null;
};

export async function requireUser(): Promise<CurrentUser> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new AppError(401, "Ban can dang nhap de tiep tuc.");
  }

  return {
    id: session.user.id,
    role: session.user.role,
    organizationId: session.user.organizationId,
    email: session.user.email
  };
}

export function requireOrganization(user: CurrentUser) {
  if (!user.organizationId) {
    throw new AppError(
      403,
      "Tai khoan chua duoc gan vao organization nao."
    );
  }

  return user.organizationId;
}

export function assertRole(user: CurrentUser, roles: Role[]) {
  if (!roles.includes(user.role)) {
    throw new AppError(403, "Ban khong co quyen thuc hien thao tac nay.");
  }
}

export function assertCanWrite(user: CurrentUser) {
  assertRole(user, [Role.ADMIN, Role.MANAGER, Role.SALES]);
}

export function assertCanManageUsers(user: CurrentUser) {
  assertRole(user, [Role.ADMIN]);
}

export function ownerScopedWhere(user: CurrentUser) {
  const organizationId = requireOrganization(user);

  if (user.role === Role.SALES) {
    return { organizationId, assignedToUserId: user.id };
  }

  return { organizationId };
}

export function canReadAssignedResource(
  user: CurrentUser,
  assignedToUserId: string | null
) {
  return user.role !== Role.SALES || assignedToUserId === user.id;
}

export function assertCanReadAssignedResource(
  user: CurrentUser,
  assignedToUserId: string | null
) {
  if (!canReadAssignedResource(user, assignedToUserId)) {
    throw new AppError(403, "Ban chi co the xem du lieu duoc giao.");
  }
}

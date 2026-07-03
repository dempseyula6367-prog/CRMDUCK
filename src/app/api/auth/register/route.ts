import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { created, handleRouteError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { assertRateLimit } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const key =
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip") ??
      "register";
    assertRateLimit(`register:${key}`, 5, 60_000);

    const input = registerSchema.parse(await request.json());
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true }
    });

    if (existingUser) {
      return created({ message: "Neu email hop le, tai khoan da san sang." });
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const result = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: input.organizationName ?? `${input.name}'s CRM`
        }
      });

      const user = await tx.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
          role: Role.ADMIN,
          organizationId: organization.id
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          organizationId: true
        }
      });

      return { user, organization };
    });

    return created(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

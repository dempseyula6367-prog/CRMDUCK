import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 12);

  const organization = await prisma.organization.upsert({
    where: { id: "seed-org" },
    update: {},
    create: {
      id: "seed-org",
      name: "Demo CRM"
    }
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Admin Demo",
      email: "admin@example.com",
      passwordHash,
      role: Role.ADMIN,
      organizationId: organization.id
    }
  });

  const sales = await prisma.user.upsert({
    where: { email: "sales@example.com" },
    update: {},
    create: {
      name: "Sales Demo",
      email: "sales@example.com",
      passwordHash,
      role: Role.SALES,
      organizationId: organization.id
    }
  });

  const customer = await prisma.customer.upsert({
    where: {
      organizationId_email: {
        organizationId: organization.id,
        email: "linh@acme.vn"
      }
    },
    update: {},
    create: {
      name: "Nguyen Thuy Linh",
      email: "linh@acme.vn",
      phone: "0900000001",
      company: "ACME Viet Nam",
      source: "Referral",
      tags: ["VIP", "B2B"],
      status: "QUALIFIED",
      assignedToUserId: sales.id,
      organizationId: organization.id
    }
  });

  await prisma.deal.upsert({
    where: { id: "seed-deal" },
    update: {},
    create: {
      id: "seed-deal",
      title: "Goi CRM nam dau",
      value: 120000000,
      stage: "NEGOTIATION",
      probability: 65,
      customerId: customer.id,
      assignedToUserId: sales.id,
      organizationId: organization.id
    }
  });

  await prisma.task.upsert({
    where: { id: "seed-task" },
    update: {},
    create: {
      id: "seed-task",
      title: "Follow-up bao gia",
      description: "Goi lai va xac nhan pham vi trien khai.",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
      priority: "HIGH",
      assignedToUserId: sales.id,
      relatedCustomerId: customer.id,
      organizationId: organization.id
    }
  });

  await prisma.activity.create({
    data: {
      type: "NOTE",
      content: "Khach quan tam tich hop Zalo OA va import du lieu cu.",
      customerId: customer.id,
      userId: admin.id,
      organizationId: organization.id
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

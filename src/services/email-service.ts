import nodemailer from "nodemailer";
import { AppError } from "@/lib/api";
import { emailQueue } from "@/lib/queue";
import { prisma } from "@/lib/prisma";
import type { CurrentUser } from "@/lib/rbac";
import {
  assertCanReadAssignedResource,
  assertCanWrite,
  requireOrganization
} from "@/lib/rbac";

export const emailTemplates = [
  {
    id: "welcome",
    name: "Chao mung",
    subject: "Rat vui duoc ket noi cung {{customerName}}",
    body: "Xin chao {{customerName}},\n\nCam on anh/chi da quan tam. Em gui thong tin de minh cung trao doi buoc tiep theo."
  },
  {
    id: "follow-up",
    name: "Follow-up",
    subject: "Follow-up noi dung da trao doi",
    body: "Xin chao {{customerName}},\n\nEm follow-up lai noi dung minh da trao doi va san sang ho tro neu anh/chi can them thong tin."
  },
  {
    id: "quote",
    name: "Bao gia",
    subject: "Bao gia theo nhu cau cua {{customerName}}",
    body: "Xin chao {{customerName}},\n\nEm gui bao gia de anh/chi tham khao. Minh co the sap xep mot buoi trao doi ngan de chot pham vi."
  }
];

export function renderTemplate(template: string, customerName: string) {
  return template.replaceAll("{{customerName}}", customerName);
}

export async function enqueueCustomerEmail(
  user: CurrentUser,
  input: { customerId: string; subject: string; body: string }
) {
  assertCanWrite(user);
  const organizationId = requireOrganization(user);

  if (!emailQueue) {
    return sendCustomerEmail(user, input);
  }

  await emailQueue.add("send-customer-email", {
    customerId: input.customerId,
    subject: input.subject,
    body: input.body,
    userId: user.id,
    role: user.role,
    organizationId
  });

  return { queued: true };
}

export async function sendCustomerEmail(
  user: CurrentUser,
  input: { customerId: string; subject: string; body: string }
) {
  assertCanWrite(user);
  const organizationId = requireOrganization(user);

  const customer = await prisma.customer.findFirst({
    where: {
      id: input.customerId,
      organizationId,
      deletedAt: null
    },
    select: {
      id: true,
      name: true,
      email: true,
      assignedToUserId: true
    }
  });

  if (!customer) throw new AppError(404, "Khong tim thay khach hang.");
  assertCanReadAssignedResource(user, customer.assignedToUserId);
  if (!customer.email) throw new AppError(400, "Khach hang chua co email.");

  const smtpReady =
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASSWORD &&
    process.env.SMTP_FROM;

  if (!smtpReady) {
    return prisma.emailLog.create({
      data: {
        customerId: customer.id,
        subject: input.subject,
        body: input.body,
        status: "FAILED",
        userId: user.id,
        organizationId
      }
    });
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: customer.email,
    subject: input.subject,
    text: input.body
  });

  const [log] = await prisma.$transaction([
    prisma.emailLog.create({
      data: {
        customerId: customer.id,
        subject: input.subject,
        body: input.body,
        status: "SENT",
        sentAt: new Date(),
        userId: user.id,
        organizationId
      }
    }),
    prisma.activity.create({
      data: {
        type: "EMAIL",
        content: `Sent email: ${input.subject}`,
        customerId: customer.id,
        userId: user.id,
        organizationId
      }
    })
  ]);

  return log;
}

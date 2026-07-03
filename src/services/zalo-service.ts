import { AppError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

type ZaloWebhookPayload = {
  sender?: { id?: string };
  user_id?: string;
  message?: {
    text?: string;
    msg_id?: string;
  };
  event_name?: string;
};

export async function handleZaloWebhook(
  payload: ZaloWebhookPayload,
  secret?: string | null
) {
  if (process.env.ZALO_WEBHOOK_SECRET && secret !== process.env.ZALO_WEBHOOK_SECRET) {
    throw new AppError(401, "Webhook secret khong hop le.");
  }

  const zaloUserId = payload.sender?.id ?? payload.user_id;
  const message = payload.message?.text ?? payload.event_name ?? "Zalo event";

  if (!zaloUserId) {
    throw new AppError(400, "Webhook thieu zaloUserId.");
  }

  const link = await prisma.zaloIntegration.findFirst({
    where: { zaloUserId },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          assignedToUserId: true,
          organizationId: true
        }
      }
    }
  });

  if (!link) {
    return { matched: false, message: "Chua lien ket Zalo user voi customer." };
  }

  await prisma.$transaction([
    prisma.activity.create({
      data: {
        type: "ZALO",
        content: message,
        customerId: link.customerId,
        organizationId: link.organizationId
      }
    }),
    prisma.zaloIntegration.update({
      where: { id: link.id },
      data: { lastMessageAt: new Date() }
    })
  ]);

  return {
    matched: true,
    customerId: link.customerId,
    assignedToUserId: link.customer.assignedToUserId
  };
}

export async function sendZaloMessage(zaloUserId: string, message: string) {
  if (!process.env.ZALO_OA_ACCESS_TOKEN) {
    throw new AppError(400, "Chua cau hinh ZALO_OA_ACCESS_TOKEN.");
  }

  const response = await fetch("https://openapi.zalo.me/v3.0/oa/message/cs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      access_token: process.env.ZALO_OA_ACCESS_TOKEN
    },
    body: JSON.stringify({
      recipient: { user_id: zaloUserId },
      message: { text: message }
    })
  });

  if (!response.ok) {
    throw new AppError(502, "Khong gui duoc tin nhan Zalo.");
  }

  return response.json();
}

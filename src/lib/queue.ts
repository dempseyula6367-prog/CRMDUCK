import { Queue } from "bullmq";
import type { Role } from "@prisma/client";

export type EmailJob = {
  customerId: string;
  userId: string;
  role: Role;
  organizationId: string;
  subject: string;
  body: string;
};

const redisUrl = process.env.REDIS_URL;

function parseRedisUrl(url: string) {
  const parsed = new URL(url);
  const db = parsed.pathname ? Number(parsed.pathname.replace("/", "")) : 0;

  return {
    host: parsed.hostname,
    port: Number(parsed.port || 6379),
    username: parsed.username || undefined,
    password: parsed.password || undefined,
    db: Number.isFinite(db) ? db : 0,
    tls: parsed.protocol === "rediss:" ? {} : undefined,
    maxRetriesPerRequest: null
  };
}

export const redisConnection = redisUrl ? parseRedisUrl(redisUrl) : null;

export const emailQueue = redisConnection
  ? new Queue<EmailJob>("email", { connection: redisConnection })
  : null;

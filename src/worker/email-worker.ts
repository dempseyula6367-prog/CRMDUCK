import { Worker } from "bullmq";
import { redisConnection } from "@/lib/queue";
import { sendCustomerEmail } from "@/services/email-service";

if (!redisConnection) {
  throw new Error("REDIS_URL is required to run email worker.");
}

new Worker(
  "email",
  async (job) => {
    await sendCustomerEmail(
      {
        id: job.data.userId,
        role: job.data.role,
        organizationId: job.data.organizationId
      },
      {
        customerId: job.data.customerId,
        subject: job.data.subject,
        body: job.data.body
      }
    );
  },
  { connection: redisConnection }
);

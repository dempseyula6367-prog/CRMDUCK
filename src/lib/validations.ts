import { z } from "zod";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  organizationName: z.string().min(2).max(120).optional()
});

export const createUserSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(["ADMIN", "MANAGER", "SALES", "VIEWER"]).default("SALES")
});

export const forgotPasswordSchema = z.object({
  email: z.string().email()
});

export const customerSchema = z.object({
  name: z.string().min(2).max(160),
  phone: z.preprocess(emptyToUndefined, z.string().min(5).max(32).optional()),
  email: z.preprocess(emptyToUndefined, z.string().email().optional()),
  company: z.preprocess(emptyToUndefined, z.string().max(160).optional()),
  address: z.preprocess(emptyToUndefined, z.string().max(240).optional()),
  source: z.preprocess(emptyToUndefined, z.string().max(80).optional()),
  tags: z.preprocess(
    (value) => {
      if (Array.isArray(value)) return value;
      if (typeof value === "string") {
        return value
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean);
      }
      return [];
    },
    z.array(z.string().min(1).max(40)).default([])
  ),
  status: z
    .enum(["LEAD", "CONTACTED", "QUALIFIED", "CUSTOMER", "CHURNED"])
    .default("LEAD"),
  assignedToUserId: z.preprocess(emptyToUndefined, z.string().optional())
});

export const activitySchema = z.object({
  type: z.enum(["CALL", "EMAIL", "ZALO", "MEETING", "NOTE"]),
  content: z.string().min(1).max(5000)
});

export const dealSchema = z.object({
  title: z.string().min(2).max(160),
  value: z.coerce.number().min(0),
  stage: z.enum(["NEW", "NEGOTIATION", "WON", "LOST"]).default("NEW"),
  probability: z.coerce.number().min(0).max(100).default(20),
  expectedCloseDate: z.preprocess(emptyToUndefined, z.string().optional()),
  customerId: z.string().min(1),
  assignedToUserId: z.preprocess(emptyToUndefined, z.string().optional())
});

export const updateDealStageSchema = z.object({
  stage: z.enum(["NEW", "NEGOTIATION", "WON", "LOST"])
});

export const taskSchema = z.object({
  title: z.string().min(2).max(160),
  description: z.preprocess(emptyToUndefined, z.string().max(5000).optional()),
  dueDate: z.preprocess(emptyToUndefined, z.string().optional()),
  status: z.enum(["TODO", "DOING", "DONE"]).default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  assignedToUserId: z.preprocess(emptyToUndefined, z.string().optional()),
  relatedCustomerId: z.preprocess(emptyToUndefined, z.string().optional())
});

export const emailSchema = z.object({
  customerId: z.string().min(1),
  subject: z.string().min(2).max(160),
  body: z.string().min(2).max(10000)
});

export const userRoleSchema = z.object({
  role: z.enum(["ADMIN", "MANAGER", "SALES", "VIEWER"])
});

export const systemSettingsSchema = z.object({
  customerSources: z.array(z.string().min(1).max(80)).default([]),
  customerTags: z.array(z.string().min(1).max(40)).default([]),
  stageLabels: z
    .object({
      NEW: z.string().min(1).max(80),
      NEGOTIATION: z.string().min(1).max(80),
      WON: z.string().min(1).max(80),
      LOST: z.string().min(1).max(80)
    })
    .default({
      NEW: "New",
      NEGOTIATION: "Negotiation",
      WON: "Won",
      LOST: "Lost"
    })
});

export type CustomerInput = z.infer<typeof customerSchema>;
export type DealInput = z.infer<typeof dealSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type SystemSettingsInput = z.infer<typeof systemSettingsSchema>;

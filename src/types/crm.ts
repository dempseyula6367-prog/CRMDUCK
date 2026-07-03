export type Role = "ADMIN" | "MANAGER" | "SALES" | "VIEWER";
export type CustomerStatus =
  | "LEAD"
  | "CONTACTED"
  | "QUALIFIED"
  | "CUSTOMER"
  | "CHURNED";
export type DealStage = "NEW" | "NEGOTIATION" | "WON" | "LOST";
export type TaskStatus = "TODO" | "DOING" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type UserLite = {
  id: string;
  name: string | null;
  email: string | null;
  role?: Role;
};

export type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  company: string | null;
  address: string | null;
  source: string | null;
  tags: string[];
  status: CustomerStatus;
  assignedToUserId: string | null;
  assignedTo?: UserLite | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    deals: number;
    activities: number;
    tasks: number;
  };
  deals?: Deal[];
  activities?: Activity[];
  tasks?: Task[];
  emailLogs?: EmailLog[];
  zaloIntegration?: {
    id: string;
    zaloUserId: string;
    lastMessageAt: string | null;
  } | null;
};

export type CustomerListResponse = {
  items: Customer[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    pageCount: number;
  };
};

export type Deal = {
  id: string;
  title: string;
  value: string | number;
  stage: DealStage;
  probability: number;
  expectedCloseDate: string | null;
  customerId: string;
  customer?: Pick<Customer, "id" | "name" | "company" | "status">;
  assignedTo?: UserLite | null;
  assignedToUserId: string | null;
  updatedAt: string;
};

export type Activity = {
  id: string;
  type: "CALL" | "EMAIL" | "ZALO" | "MEETING" | "NOTE";
  content: string;
  createdAt: string;
  user?: UserLite | null;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignedToUserId: string | null;
  relatedCustomerId: string | null;
  assignedTo?: UserLite | null;
  relatedCustomer?: Pick<Customer, "id" | "name" | "company"> | null;
};

export type EmailLog = {
  id: string;
  subject: string;
  body: string;
  status: "SENT" | "OPENED" | "CLICKED" | "FAILED";
  sentAt: string | null;
  createdAt: string;
};

export type PipelineStats = {
  totalOpenValue: number;
  totalWonValue: number;
  conversionRate: number;
  byStage: {
    stage: DealStage;
    count: number;
    totalValue: number;
    weightedValue: number;
  }[];
};

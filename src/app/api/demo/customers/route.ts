import { NextResponse } from "next/server";
import {
  ActivityType,
  CustomerStatus,
  DealStage,
  Role,
  TaskPriority,
  TaskStatus
} from "@prisma/client";
import { handleRouteError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { assertRole, requireOrganization, requireUser } from "@/lib/rbac";

export const dynamic = "force-dynamic";

const sampleCustomers = [
  {
    name: "Nguyễn Minh An",
    email: "minhan.demo01@example.com",
    phone: "0901001001",
    company: "An Phát Retail",
    source: "Facebook Ads",
    tags: ["Hot lead", "B2C"],
    status: CustomerStatus.LEAD,
    deal: {
      title: "Gói CRM Starter",
      value: 18000000,
      stage: DealStage.NEW,
      probability: 25
    },
    task: {
      title: "Gọi xác nhận nhu cầu CRM",
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH
    },
    activity: {
      type: ActivityType.NOTE,
      content: "Lead mới từ Facebook Ads, quan tâm quản lý khách hàng cơ bản."
    }
  },
  {
    name: "Trần Thị Bích",
    email: "bichtran.demo02@example.com",
    phone: "0901001002",
    company: "Bích Studio",
    source: "Zalo",
    tags: ["Warm", "SME"],
    status: CustomerStatus.CONTACTED,
    deal: {
      title: "Setup CRM cho studio",
      value: 32000000,
      stage: DealStage.NEGOTIATION,
      probability: 55
    },
    task: {
      title: "Gửi bảng giá và case study",
      status: TaskStatus.DOING,
      priority: TaskPriority.MEDIUM
    },
    activity: {
      type: ActivityType.CALL,
      content: "Đã trao đổi qua Zalo, khách muốn xem demo pipeline bán hàng."
    }
  },
  {
    name: "Lê Quốc Cường",
    email: "cuongle.demo03@example.com",
    phone: "0901001003",
    company: "Cường Logistics",
    source: "Referral",
    tags: ["B2B", "Qualified"],
    status: CustomerStatus.QUALIFIED,
    deal: {
      title: "CRM quản lý đội sales logistics",
      value: 85000000,
      stage: DealStage.NEGOTIATION,
      probability: 70
    },
    task: {
      title: "Hẹn demo quy trình B2B",
      status: TaskStatus.TODO,
      priority: TaskPriority.URGENT
    },
    activity: {
      type: ActivityType.MEETING,
      content: "Khách được giới thiệu từ đối tác, có ngân sách rõ ràng."
    }
  },
  {
    name: "Phạm Hoài Nam",
    email: "hoainam.demo04@example.com",
    phone: "0901001004",
    company: "Nam Furniture",
    source: "Website",
    tags: ["VIP", "Enterprise"],
    status: CustomerStatus.CUSTOMER,
    deal: {
      title: "Triển khai CRM doanh nghiệp",
      value: 125000000,
      stage: DealStage.WON,
      probability: 100
    },
    task: {
      title: "Theo dõi onboarding tuần đầu",
      status: TaskStatus.DOING,
      priority: TaskPriority.HIGH
    },
    activity: {
      type: ActivityType.NOTE,
      content: "Khách đã chốt gói triển khai, cần chăm sóc onboarding kỹ."
    }
  },
  {
    name: "Võ Thu Hà",
    email: "thuha.demo05@example.com",
    phone: "0901001005",
    company: "Hà Beauty",
    source: "Instagram",
    tags: ["Cold", "Follow-up"],
    status: CustomerStatus.LEAD,
    deal: {
      title: "CRM mini cho spa",
      value: 15000000,
      stage: DealStage.NEW,
      probability: 20
    },
    task: {
      title: "Nuôi dưỡng lại sau 3 ngày",
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW
    },
    activity: {
      type: ActivityType.EMAIL,
      content: "Đã gửi tài liệu giới thiệu, khách chưa phản hồi."
    }
  },
  {
    name: "Đặng Gia Hưng",
    email: "giahung.demo06@example.com",
    phone: "0901001006",
    company: "Hưng Auto",
    source: "Google Search",
    tags: ["Hot lead", "High value"],
    status: CustomerStatus.CONTACTED,
    deal: {
      title: "CRM chăm sóc khách mua xe",
      value: 64000000,
      stage: DealStage.NEGOTIATION,
      probability: 60
    },
    task: {
      title: "Gửi proposal bản nâng cao",
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH
    },
    activity: {
      type: ActivityType.CALL,
      content: "Khách hỏi kỹ về tự động nhắc lịch chăm sóc sau bán."
    }
  },
  {
    name: "Hoàng Kim Ngân",
    email: "kimngan.demo07@example.com",
    phone: "0901001007",
    company: "Kim Ngân Fashion",
    source: "TikTok Ads",
    tags: ["B2C", "Promotion"],
    status: CustomerStatus.QUALIFIED,
    deal: {
      title: "CRM bán lẻ thời trang",
      value: 42000000,
      stage: DealStage.NEW,
      probability: 45
    },
    task: {
      title: "Tư vấn phân nhóm khách hàng",
      status: TaskStatus.DOING,
      priority: TaskPriority.MEDIUM
    },
    activity: {
      type: ActivityType.ZALO,
      content: "Khách cần quản lý khách quay lại và chiến dịch khuyến mãi."
    }
  },
  {
    name: "Bùi Đức Sơn",
    email: "ducson.demo08@example.com",
    phone: "0901001008",
    company: "Sơn Tech",
    source: "LinkedIn",
    tags: ["B2B", "SaaS"],
    status: CustomerStatus.CUSTOMER,
    deal: {
      title: "CRM SaaS team sales",
      value: 96000000,
      stage: DealStage.WON,
      probability: 100
    },
    task: {
      title: "Kiểm tra mức độ sử dụng sau triển khai",
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM
    },
    activity: {
      type: ActivityType.MEETING,
      content: "Khách đã mua, cần theo dõi adoption của team sales."
    }
  },
  {
    name: "Mai Thanh Tâm",
    email: "thanhtam.demo09@example.com",
    phone: "0901001009",
    company: "Tâm Cafe",
    source: "Walk-in",
    tags: ["Small business", "Churn risk"],
    status: CustomerStatus.CHURNED,
    deal: {
      title: "CRM quán cafe",
      value: 12000000,
      stage: DealStage.LOST,
      probability: 0
    },
    task: {
      title: "Ghi nhận lý do mất khách",
      status: TaskStatus.DONE,
      priority: TaskPriority.LOW
    },
    activity: {
      type: ActivityType.NOTE,
      content: "Khách tạm dừng vì ngân sách thấp, có thể quay lại sau."
    }
  },
  {
    name: "Đỗ Phương Linh",
    email: "phuonglinh.demo10@example.com",
    phone: "0901001010",
    company: "Linh Education",
    source: "Email campaign",
    tags: ["Education", "Long term"],
    status: CustomerStatus.QUALIFIED,
    deal: {
      title: "CRM tư vấn tuyển sinh",
      value: 58000000,
      stage: DealStage.NEGOTIATION,
      probability: 65
    },
    task: {
      title: "Chuẩn bị demo cho trung tâm",
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH
    },
    activity: {
      type: ActivityType.EMAIL,
      content: "Khách quan tâm quản lý học viên tiềm năng theo nguồn."
    }
  }
];

function dueDate(daysFromNow: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    assertRole(user, [Role.ADMIN, Role.MANAGER]);
    const organizationId = requireOrganization(user);

    const result = {
      customers: 0,
      deals: 0,
      tasks: 0,
      activities: 0
    };

    for (const [index, sample] of sampleCustomers.entries()) {
      const customer = await prisma.customer.upsert({
        where: {
          organizationId_email: {
            organizationId,
            email: sample.email
          }
        },
        update: {
          name: sample.name,
          phone: sample.phone,
          company: sample.company,
          source: sample.source,
          tags: sample.tags,
          status: sample.status,
          assignedToUserId: user.id,
          deletedAt: null
        },
        create: {
          name: sample.name,
          email: sample.email,
          phone: sample.phone,
          company: sample.company,
          source: sample.source,
          tags: sample.tags,
          status: sample.status,
          assignedToUserId: user.id,
          organizationId
        },
        select: { id: true }
      });

      result.customers += 1;

      const dealCount = await prisma.deal.count({
        where: {
          customerId: customer.id,
          organizationId,
          title: sample.deal.title,
          deletedAt: null
        }
      });

      if (dealCount === 0) {
        await prisma.deal.create({
          data: {
            ...sample.deal,
            expectedCloseDate: dueDate(index + 7),
            customerId: customer.id,
            assignedToUserId: user.id,
            organizationId
          }
        });
        result.deals += 1;
      }

      const taskCount = await prisma.task.count({
        where: {
          relatedCustomerId: customer.id,
          organizationId,
          title: sample.task.title,
          deletedAt: null
        }
      });

      if (taskCount === 0) {
        await prisma.task.create({
          data: {
            ...sample.task,
            description: `Dữ liệu mẫu cho khách ${sample.name}.`,
            dueDate: dueDate(index + 1),
            relatedCustomerId: customer.id,
            assignedToUserId: user.id,
            organizationId
          }
        });
        result.tasks += 1;
      }

      const activityCount = await prisma.activity.count({
        where: {
          customerId: customer.id,
          organizationId,
          content: sample.activity.content
        }
      });

      if (activityCount === 0) {
        await prisma.activity.create({
          data: {
            ...sample.activity,
            customerId: customer.id,
            userId: user.id,
            organizationId
          }
        });
        result.activities += 1;
      }
    }

    const url = new URL(request.url);
    if (url.searchParams.get("redirect") === "1") {
      return NextResponse.redirect(new URL("/customers", request.url));
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    return handleRouteError(error);
  }
}

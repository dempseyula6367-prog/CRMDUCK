# Next.js CRM Full-stack

CRM quan ly khach hang, pipeline ban hang, task, dashboard, Email va Zalo integration skeleton. Du an dung Next.js App Router, TypeScript, TailwindCSS, Prisma/PostgreSQL va NextAuth.

## Cau truc chinh

```txt
src/app              App Router, UI pages va API routes
src/components       UI primitives va CRM widgets
src/lib              Prisma, auth, RBAC, validation, service helpers
src/services         Business logic tach khoi route handler
src/worker           Background worker cho email queue
prisma/schema.prisma Database schema
tests                Unit tests
```

## Chay local

1. Cai dependencies:

```bash
npm install
```

2. Tao file `.env` tu `.env.example`, cap nhat `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`.

3. Tao database PostgreSQL va migrate. Neu may khong co Docker/Postgres, dung DB local nhung trong project:

```bash
npm run db:local
```

Mo terminal khac va tiep tuc migrate/seed.

Neu may co Docker:

```bash
docker compose up -d
```

Neu khong co Docker, cai PostgreSQL local va tao database `crm`, hoac cap nhat `DATABASE_URL` toi database PostgreSQL co san.

Sau do chay migrate/seed:

```bash
npm run prisma:migrate
npm run db:seed
```

4. Chay app:

```bash
npm run dev
```

Tai khoan seed:

- `admin@example.com` / `Password123!`
- `sales@example.com` / `Password123!`

## Lenh huu ich

```bash
npm run lint
npm test
npm run build
npm run prisma:studio
npm run worker:email
```

## Bien moi truong

- `DATABASE_URL`: PostgreSQL connection string. Local embedded DB mac dinh dung database `crm_utf8` de ho tro tieng Viet co dau.
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`: cau hinh NextAuth.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: Google OAuth.
- `SMTP_*`: gui email truc tiep tu trang khach hang.
- `REDIS_URL`: BullMQ queue cho email/background jobs.
- `ZALO_OA_ACCESS_TOKEN`, `ZALO_WEBHOOK_SECRET`: tich hop Zalo OA webhook.
- `S3_*`: san sang cho file/avatar storage S3-compatible.

## Phan quyen

- `ADMIN`: toan quyen, quan ly user va cau hinh.
- `MANAGER`: xem team, bao cao, pipeline va giao viec.
- `SALES`: chi thao tac tren khach hang/deal/task duoc giao.
- `VIEWER`: chi xem, khong sua du lieu.

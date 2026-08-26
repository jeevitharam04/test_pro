# EduCare SaaS

EduCare is a multi-tenant school management SaaS platform for Indian schools. This workspace starts with Phase 1 from the project prompt: authentication, multi-tenant architecture, RBAC, database schema, and the initial dashboards/API documentation surface.

## Quick Start

```bash
npm install
cp .env.example .env
docker compose up -d postgres redis
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Default seed users use the password `Password@123`.

For a full runbook, see `docs/runbook.md`.

## Architecture

- `src/app`: Next.js App Router pages and API route handlers
- `src/modules`: self-contained EduCare feature modules
- `src/shared`: cross-cutting auth, RBAC, tenant, validation, response helpers
- `src/infrastructure`: Prisma, Redis, queues, storage, and external providers
- `src/database`: Prisma-facing database helpers
- `src/jobs`: BullMQ job processors
- `docs/openapi.yaml`: API contract
- `docs/architecture.md`: deployment and stack decisions

Every tenant-owned model includes `schoolId`, and API handlers resolve the session tenant before data access.

## Current REST Surface

- `/api/v1/auth/*`
- `/api/v1/students`
- `/api/v1/attendance`
- `/api/v1/exam-types`
- `/api/v1/marks`
- `/api/v1/homework`
- `/api/v1/fees`
- `/api/v1/payments`
- `/api/v1/announcements`
- `/api/v1/timetable`
- `/api/v1/reports/*`
- `/api/v1/storage/signed-url`
- `/api/v1/classes`
- `/api/v1/classes/:id`
- `/api/v1/subjects`
- `/api/v1/subjects/:id`

The original `/api/auth`, `/api/users`, and `/api/schools/current` routes remain for compatibility while the REST v1 surface expands.

## MVP Modules

The current build includes working tenant-scoped foundations for authentication, users, school setup, classes, subjects, students, attendance, marks, homework, fees, payments, announcements, timetable, reports, notification queues, logging, and error tracking hooks. Provider-backed flows such as Razorpay capture, S3 presigned URLs, OAuth, and email/SMS delivery are shaped behind API boundaries and require real credentials before production use.

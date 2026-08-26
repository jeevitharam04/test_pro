# EduCare Architecture Notes

## Backend

EduCare uses Next.js API route handlers as the Node.js backend. REST endpoints are versioned under `/api/v1` for stable client contracts while the original internal routes remain available during migration.

- Runtime: Node.js with TypeScript
- Database: PostgreSQL through Prisma ORM
- Cache and sessions: Redis
- Rate limiting: Redis-first limiter with in-memory local fallback
- Async jobs: BullMQ queues for email and SMS work
- Auth: JWT access tokens, rotating refresh tokens, secure HTTP-only cookies
- OAuth2: Google and Microsoft environment hooks are reserved for the auth module
- Logging: Pino structured logs
- Error tracking: Sentry hooks via `sentry.server.config.ts` and `sentry.edge.config.ts`
- Storage: S3-compatible configuration reserved for documents and homework attachments

## Frontend

The web app is React 19 through Next.js App Router, using Tailwind CSS, React Hook Form-ready validation patterns, Zod, Zustand-ready state boundaries, TanStack Query provider, Recharts, and lucide icons. Mobile is planned for Phase 2 with React Native or Flutter.

## Infrastructure

Local development uses Docker Compose for PostgreSQL and Redis. Production targets can be AWS ECS/EC2, DigitalOcean, or Railway, fronted by Cloudflare and custom SSL. Terraform is optional and should be added once the hosting target is selected.

## Tenant Isolation

All tenant-owned records carry `schoolId`. API handlers resolve the authenticated session, verify the user's school boundary, and pass `schoolId` into service queries. RBAC checks run before tenant data is read or changed.

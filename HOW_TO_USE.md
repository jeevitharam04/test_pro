# EduCore: How to Use This Project

This guide explains how to run and use EduCore when you have the project source code.

EduCore is a role-based institution management application built with Next.js, Prisma, PostgreSQL, Redis, and Docker. It supports Principal/Admin, Faculty, Parent, and Student dashboards.

## 0. Using the Project ZIP

When you receive the project ZIP, extract it to a local folder first. Do not run the project from inside the ZIP viewer.

The ZIP should contain source code, Prisma migrations, Docker files, tests, and documentation. It intentionally does not contain `node_modules`, `.next`, `.git`, `.env`, production secrets, or the old `.github.zip` archive.

You need to install:

- Docker Desktop with Linux containers enabled
- Node.js 20 or later
- npm, included with Node.js
- Git is optional when using the ZIP; it is only needed for GitHub updates

Docker Desktop login is optional for this project because the public `postgres` and `redis` images can be pulled anonymously. If your organization requires Docker Hub authentication, sign in to Docker Desktop with your own account before running Docker commands. Never put Docker passwords or tokens in this project.

The complete first-time setup is:

```powershell
cd "C:\path\to\extracted\test_pro"
Copy-Item .env.example .env
npm install
docker compose up -d postgres redis
docker compose ps
npm run setup:local
npm run dev
```

Then open `http://localhost:3000/login`.

For an existing installation, use `docker compose up -d postgres redis`, `npm run prisma:deploy`, and `npm run dev`. Do not run the seed command against a production database.

## 1. Requirements

Install the following before starting:

- Node.js 20 or later
- npm
- Docker Desktop
- Git, if cloning from a repository

Docker Desktop must be running with Linux containers enabled.

## 2. Open the Project

Open a PowerShell terminal in the project folder:

```powershell
cd "C:\path\to\test_pro"
```

Install dependencies:

```powershell
npm install
```

The ZIP does not include a real `.env` file. Create one from the template:

```powershell
Copy-Item .env.example .env
```

The local template values are suitable only for local Docker development. Replace secrets and provider values before deployment.

## 3. Start the Database and Redis

Start the required services:

```powershell
docker compose up -d postgres redis
```

Check their status:

```powershell
docker compose ps
```

PostgreSQL should be healthy and Redis should be running.

## 4. Create the Database

Apply the Prisma migrations:

```powershell
npx prisma migrate deploy
```

Generate the Prisma client:

```powershell
npx prisma generate
```

Load demo institution data:

```powershell
npm run prisma:seed
```

The seed creates demo users, faculty, students, parents, Engineering branches, subjects, marks, and linked parent/student accounts.

For a complete local setup, this command can also be used after `npm install` and `docker compose up -d postgres redis`:

```powershell
npm run setup:local
```

## 5. Start the Web Application

Run the development server:

```powershell
npm run dev
```

Open the application at:

- Dashboard: http://localhost:3000/dashboard
- Login: http://localhost:3000/login
- Signup: http://localhost:3000/signup
- API health: http://localhost:3000/api/health
- API documentation: http://localhost:3000/docs/api

Keep the terminal running while using the application.

## 6. Demo Login Accounts

All demo accounts use this local password:

```text
Password@123
```

### Principal/Admin

```text
principal@demo.edu
```

The Principal can manage students, faculty, courses, fees, announcements, examinations, reports, and institution analytics. The Principal monitors attendance but does not take attendance.

### Faculty

```text
teacher@demo.edu
```

Faculty can view assigned courses and students, take attendance, enter marks, manage assignments, view timetable data, and generate reports.

Additional seeded faculty accounts include:

```text
kavitha.rao@demo.edu
rahul.menon@demo.edu
sneha.iyer@demo.edu
vivek.shah@demo.edu
priya.nair@demo.edu
arvind.kumar@demo.edu
meera.joshi@demo.edu
suresh.bhat@demo.edu
neha.reddy@demo.edu
amit.verma@demo.edu
```

### Parent

```text
parent@demo.edu
```

This account is linked to the demo student with admission ID `ADM-1001`. Parents can view linked student attendance, results, assignments, fees, timetable, and announcements.

Additional parent accounts follow this pattern:

```text
parent.adm-1002@demo.edu
parent.adm-1003@demo.edu
```

### Student

```text
student@demo.edu
```

This account is linked to admission ID `ADM-1001`. Students can view only their own attendance, results, assignments, fees, timetable, announcements, and profile.

## 7. Using the Principal Dashboard

After signing in as Principal:

1. Open **Students** to view all enrolled students.
2. Use **New admission** to add a student.
3. Admission ID and roll number are allocated automatically.
4. Provide a student email if the student should receive a login account.
5. Add guardian details when creating a student.
6. Open a student name or ID to view the 360-degree profile.
7. Open **Faculty & users** to create a faculty login.
8. Open **Courses** to create branches and assign faculty.
9. Open **Fees & finance** to create branch-specific fee plans.
10. Open **Announcements** to publish updates by category, priority, audience, and branch.
11. Open **Attendance overview** to monitor attendance history and absences.

## 8. Student IDs and Full Profiles

Every student has:

- A database UUID
- A unique admission ID within the institution
- A branch/course assignment
- An automatically assigned roll number within the branch

From **Students**, search using either the full UUID or admission ID, such as:

```text
ADM-1001
```

When a matching ID is entered, the application opens the student profile containing:

- Personal and medical details
- Blood group
- Class or branch
- Class teacher
- Parent/guardian information
- Attendance history
- Marks and grades
- Homework submissions
- Fee payments

## 9. Engineering Demo Structure

The seeded demo uses this academic hierarchy:

```text
Engineering
├── Core
│   ├── Telecommunication
│   ├── ECE
│   └── ETE
└── IT
    ├── AI & ML
    ├── CSE
    └── ISE
```

The main demo student cohort is distributed across these branches.

## 10. Role Rules

- Principal: institution-wide management and analytics
- Faculty: assigned courses, assigned students, attendance, marks, assignments, and reports
- Parent: linked children only; can monitor and pay fees when payment integration is configured
- Student: own information only; read-only academic access

These restrictions are enforced in both the interface and API handlers.

## 11. Add a New Principal Institution

Open:

```text
http://localhost:3000/signup
```

Complete every required field:

- Institution name
- Institution slug in lowercase, such as `new-engineering-college`
- Principal name
- Email
- Phone number
- Password with at least 8 characters

Use a new email address and a new slug. Emails and institution slugs must be unique.

## 12. Validation and Error Messages

The application displays the reason for common failures, including:

- Invalid or missing fields
- Existing email address
- Existing institution slug
- Existing admission ID
- Database connection errors in local development
- Unauthenticated or expired sessions

If a session expires, sign in again at `/login`.

## 13. Useful Development Commands

```powershell
npm run dev             # Start development server
npm run lint            # Run ESLint
npx tsc --noEmit        # Run TypeScript checks
npm run test            # Run unit tests
npm run build           # Create production build
npm run prisma:seed     # Load or refresh demo data
npm run prisma:deploy   # Apply database migrations
```

Stop local services when finished:

```powershell
docker compose down
```

This stops the containers but keeps the named database volumes.

## 14. Public Deployment

`localhost` is accessible only from the local computer. To give other people a link, deploy the Next.js app to a hosting provider such as Vercel, Railway, or DigitalOcean.

A public deployment needs hosted services rather than local Docker services:

```env
DATABASE_URL=hosted-postgresql-url
REDIS_URL=hosted-redis-url
JWT_SECRET=long-production-secret
```

Before production, also configure payment, email, SMS, storage, and monitoring credentials as described in `docs/runbook.md`.

Do not expose the local PostgreSQL port publicly and do not use the development JWT secret in production.

## 15. Software Scope and Pending Work

Hardware integrations are intentionally excluded from this software delivery. Face-recognition cameras, biometric/thumb-print terminals, and physical attendance devices are future integrations.

For the complete software status, pending requirements, completion approach, production prerequisites, and hardware exclusions, read:

```text
SOFTWARE_STATUS_AND_COMPLETION_PLAN.txt
```

The current project is a working MVP with authentication, tenant-scoped modules, attendance, marks, homework, fees, notifications, reports, exports, subscription limits, privacy workflows, storage quota enforcement, Docker services, migrations, and seed data. The remaining production work is documented in that file.

## 16. Troubleshooting

### Dashboard says unauthenticated

Sign in again. Access tokens expire after a limited period, and browser cookies belong to the exact host used. Use `localhost` consistently.

### Signup says email already registered

Use a different email address. User emails are globally unique.

### Signup says internal server error

Check that Docker Desktop is running and PostgreSQL is healthy:

```powershell
docker compose ps
```

### Migration cannot connect

Start PostgreSQL first:

```powershell
docker compose up -d postgres redis
npx prisma migrate deploy
```

### Prisma reports a Windows file lock

Stop the Next.js development server, then run:

```powershell
npx prisma generate
```

## Security Note

The seeded credentials are for local development only. Change all passwords, JWT secrets, database credentials, and third-party keys before sharing or deploying the application publicly.

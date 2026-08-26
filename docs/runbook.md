# EduCare Runbook

## Local Live Run

Install and start Docker Desktop first. Make sure Docker Desktop is using Linux containers.

Then run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/start-local.ps1
```

Or run the commands manually:

```powershell
docker compose up -d postgres redis
npm run prisma:deploy
npm run prisma:seed
npm run dev
```

Open:

- App: `http://localhost:3000`
- Login: `http://localhost:3000/login`
- Health: `http://localhost:3000/api/health`
- API docs: `http://localhost:3000/docs/api`

Seed credentials:

- Principal: `principal@demo.edu`
- Teacher: `teacher@demo.edu`
- Parent: `parent@demo.edu`
- Student: `student@demo.edu`
- Password for all: `Password@123`

## Full Docker Run

After Docker Desktop is running:

```powershell
docker compose up --build
```

The app container runs migrations before starting.

## Production Checklist

Before a public deployment, set real values for:

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_SECRET`
- `RESEND_API_KEY`
- `MSG91_API_KEY`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `S3_BUCKET`
- `SENTRY_DSN`
- OAuth client IDs/secrets if Google/Microsoft login is enabled

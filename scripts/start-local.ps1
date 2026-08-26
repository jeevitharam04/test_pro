$ErrorActionPreference = "Stop"

Write-Host "Starting EduCare dependencies..."
docker compose up -d postgres redis

Write-Host "Applying database migrations..."
npm.cmd run prisma:deploy

Write-Host "Seeding demo data..."
npm.cmd run prisma:seed

Write-Host "Starting EduCare at http://localhost:3000"
npm.cmd run dev

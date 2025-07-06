@echo off
REM Windows batch script untuk menjalankan dengan Supabase

echo 🚀 Starting School Management System...
echo ☁️  Environment: Development (Supabase)
echo.

REM Set environment variables untuk Windows
set NODE_ENV=development
set USE_SUPABASE=true

REM Start Next.js development server dengan Supabase
echo ▶️  Starting development server with Supabase...
npm run dev:supabase

pause

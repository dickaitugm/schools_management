@echo off
REM Windows batch script untuk menjalankan development server

echo 🚀 Starting School Management System...
echo 🏠 Environment: Development (Local PostgreSQL)
echo.

REM Set environment variables untuk Windows
set NODE_ENV=development
set USE_SUPABASE=false

REM Start Next.js development server
echo ▶️  Starting development server...
echo 🗃️ Database: Local PostgreSQL (bb_society_db)
npm run dev

pause

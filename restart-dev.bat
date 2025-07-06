@echo off
echo 🔄 Restarting development server...

REM Kill any existing Node.js processes
taskkill /f /im node.exe 2>nul

REM Wait a moment
timeout /t 2 /nobreak >nul

echo 🚀 Starting School Management System...
echo 🏠 Environment: Development (Local PostgreSQL)
echo 🗃️ Database: bb_society_db
echo.

REM Set environment and start
set NODE_ENV=development
set USE_SUPABASE=false
npm run dev

pause

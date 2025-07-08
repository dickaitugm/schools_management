@echo off
echo.
echo ====================================
echo   Starting BB Society Management
echo ====================================
echo.
echo 1. Starting development server...
cd /d "c:\Users\dicka\Documents\program\javascript\schools_management"
start /b npm run dev

echo.
echo 2. Waiting for server to start...
timeout /t 5 /nobreak >nul

echo.
echo 3. Opening application in browser...
start "" "http://localhost:3000"

echo.
echo ====================================
echo   Application started successfully!
echo ====================================
echo.
echo Instructions:
echo 1. Login with admin credentials
echo 2. Navigate to "User ^& Role Management" in sidebar
echo 3. Use "Tambah User Baru" button to add users
echo.
echo Press any key to close this window...
pause >nul

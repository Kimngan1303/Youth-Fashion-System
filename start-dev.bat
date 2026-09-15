@echo off
chcp 65001 > nul
echo ========================================================
echo    YOUTH FASHION - KHỞI ĐỘNG HỆ THỐNG PHÁT TRIỂN
echo ========================================================
echo.

echo [1/2] Đang khởi động Backend API Server (Port 5000)...
start "YouthFashion - Backend API" cmd /k "cd backend && npm start"

echo [2/2] Đang khởi động Frontend Vite React (Port 5173)...
start "YouthFashion - Frontend Web" cmd /k "cd frontend && npm run dev"

echo.
echo ✅ Đã khởi động xong!
echo 👉 Truy cập website tại: http://localhost:5173/
echo.
pause

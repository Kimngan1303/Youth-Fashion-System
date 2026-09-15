@echo off
chcp 65001 > nul
echo ========================================================
echo    YOUTH FASHION - TỰ ĐỘNG ĐẨY CODE LÊN GITHUB
echo ========================================================
echo.

set /p commit_msg="Nhập nội dung commit (hoặc nhấn Enter để dùng mặc định): "
if "%commit_msg%"=="" set commit_msg="feat: cap nhat du an Youth Fashion"

echo.
echo ⏳ Đang thêm tất cả thay đổi (git add .)...
git add .

echo ⏳ Đang tạo commit: %commit_msg%...
git commit -m "%commit_msg%"

echo ⏳ Đang kéo code mới nhất từ GitHub về (git pull origin main)...
git pull origin main --rebase

echo ⏳ Đang đẩy code lên GitHub (git push origin main)...
git push -u origin main

echo.
echo ========================================================
echo ✅ Hoàn tất đẩy code lên GitHub repository!
echo 🔗 https://github.com/Kimngan1303/Youth-Fashion-System.git
echo ========================================================
echo.
pause

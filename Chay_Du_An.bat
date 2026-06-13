@echo off
chcp 65001 >nul
echo ===================================================
echo   KHOI DONG DU AN FASHION STORE (CAI DAT VA CHAY)
echo ===================================================
echo.

echo 1. Dang kiem tra va cai dat thu vien cho Backend...
cd backend
if not exist "node_modules" (
    echo Dang tai thu vien backend, vui long doi vai phut...
    call npm install
) else (
    echo Da co node_modules, bo qua buoc cai dat.
)
cd ..

echo.
echo 2. Dang kiem tra va cai dat thu vien cho Frontend...
cd frontend
if not exist "node_modules" (
    echo Dang tai thu vien frontend, vui long doi vai phut...
    call npm install --legacy-peer-deps
) else (
    echo Da co node_modules, bo qua buoc cai dat.
)
cd ..

echo.
echo 3. Dang khoi dong Backend va Frontend...
echo.
echo [!] Luu y: Vui long GIU NGUYEN cua so nay va 2 cua so moi hien len.
echo.

:: Khoi dong Backend trong cua so cmd moi
start "Backend Server" cmd /k "color 0A && cd backend && echo [BACKEND] Dang chay o cong 5000... && npm start"

:: Khoi dong Frontend trong cua so cmd moi
start "Frontend Server" cmd /k "color 0B && cd frontend && echo [FRONTEND] Dang chay o cong 3000... && npm run dev"

echo Da mo 2 cua so cho Backend va Frontend.
echo Vui long cho 10-15 giay de trang web tu dong mo len...
echo.
timeout /t 5 /nobreak >nul
start http://localhost:3000
pause

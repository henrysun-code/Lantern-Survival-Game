@echo off
setlocal
cd /d "%~dp0"

echo 正在啟動本機遊戲伺服器...
start "Lantern Survival Game Server" /D "%~dp0" cmd /k "pnpm dev --host 127.0.0.1"

timeout /t 3 /nobreak >nul
start "" "http://127.0.0.1:5173/"

echo.
echo 遊戲已開啟：http://127.0.0.1:5173/
echo 關閉遊戲時，請關閉「Lantern Survival Game Server」視窗。
endlocal

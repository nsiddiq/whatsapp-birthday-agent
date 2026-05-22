@echo off
setlocal EnableDelayedExpansion
title Birthday Agent Launcher
color 0A

:MENU
cls
echo.
echo  ============================================
echo       Birthday Agent - WhatsApp
echo  ============================================
echo.
echo   [1]  Install Dependencies
echo   [2]  Start Agent (Backend + Frontend)
echo   [3]  Start Backend Only
echo   [4]  Start Frontend Only
echo   [5]  Reset WhatsApp Session (Re-link)
echo   [6]  Open Dashboard in Browser
echo   [7]  Check Node.js Version
echo   [8]  Exit
echo.
echo  ============================================
echo.
set "choice="
set /p "choice=  Select an option (1-8): "

if "!choice!"=="1" goto INSTALL
if "!choice!"=="2" goto START_ALL
if "!choice!"=="3" goto START_BACKEND
if "!choice!"=="4" goto START_FRONTEND
if "!choice!"=="5" goto RESET_SESSION
if "!choice!"=="6" goto OPEN_BROWSER
if "!choice!"=="7" goto CHECK_NODE
if "!choice!"=="8" goto EXIT

echo.
echo  Invalid choice. Try again.
ping -n 3 127.0.0.1 >nul
goto MENU

:CHECK_NODE
cls
echo.
echo  Checking Node.js...
echo  -------------------
echo.
where node >nul 2>nul
if !errorlevel! neq 0 (
    echo  [ERROR] Node.js is NOT installed!
    echo.
    echo  Download it from: https://nodejs.org
) else (
    for /f "tokens=*" %%v in ('node --version') do echo  Node.js version: %%v
    echo.
    where npm >nul 2>nul
    if !errorlevel! neq 0 (
        echo  [ERROR] npm is NOT available.
    ) else (
        for /f "tokens=*" %%v in ('npm --version') do echo  npm version: %%v
        echo  [OK] Ready to go!
    )
)
echo.
echo  Press any key to return to menu...
pause >nul
goto MENU

:INSTALL
cls
echo.
echo  Installing dependencies...
echo  ==========================
echo.
cd /d "%~dp0"
call npm install
echo.
echo  Press any key to return to menu...
pause >nul
goto MENU

:START_ALL
cls
echo.
echo  Starting Birthday Agent (Backend + Frontend)...
echo  ================================================
echo.
echo  Backend:  http://localhost:3001
echo  Frontend: http://localhost:5173
echo.
echo  A QR code will appear below - scan it with WhatsApp.
echo  Press Ctrl+C to stop, then any key to return to menu.
echo.
echo  ------------------------------------------------
echo.
cd /d "%~dp0"
call npm run dev
echo.
echo  Press any key to return to menu...
pause >nul
goto MENU

:START_BACKEND
cls
echo.
echo  Starting Backend Only...
echo  ========================
echo.
echo  Running on: http://localhost:3001
echo  Press Ctrl+C to stop, then any key to return to menu.
echo.
echo  ------------------------------------------------
echo.
cd /d "%~dp0"
call npm run dev:backend
echo.
echo  Press any key to return to menu...
pause >nul
goto MENU

:START_FRONTEND
cls
echo.
echo  Starting Frontend Only...
echo  =========================
echo.
echo  Running on: http://localhost:5173
echo  Press Ctrl+C to stop, then any key to return to menu.
echo.
echo  ------------------------------------------------
echo.
cd /d "%~dp0"
call npm run dev:frontend
echo.
echo  Press any key to return to menu...
pause >nul
goto MENU

:RESET_SESSION
cls
echo.
echo  Reset WhatsApp Session
echo  ======================
echo.
echo  This will delete your saved WhatsApp login.
echo  You will need to scan the QR code again.
echo.
set "confirm="
set /p "confirm=  Are you sure? (Y/N): "
if /i "!confirm!"=="Y" (
    cd /d "%~dp0"
    if exist "backend\auth_session" (
        rmdir /s /q "backend\auth_session"
        echo.
        echo  [OK] Session cleared. Start the agent to get a new QR code.
    ) else (
        echo.
        echo  No session found. Nothing to reset.
    )
) else (
    echo.
    echo  Cancelled.
)
echo.
echo  Press any key to return to menu...
pause >nul
goto MENU

:OPEN_BROWSER
cls
echo.
echo  Opening dashboard in browser...
echo.
start "" http://localhost:5173
echo  [OK] Opened http://localhost:5173
echo.
echo  Make sure the frontend is running first (Option 2 or 4).
echo.
echo  Press any key to return to menu...
pause >nul
goto MENU

:EXIT
cls
echo.
echo  Goodbye!
echo.
exit /b 0

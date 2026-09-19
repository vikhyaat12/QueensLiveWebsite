@echo off
setlocal EnableDelayedExpansion
title Queens Care Website — Launcher

:: ============================================================
::  Queens Care Laboratories — Windows Launcher
::  Auto-detects project path, checks Node.js, starts dev server,
::  waits for ready, opens browser. One double-click experience.
:: ============================================================

set "PROJECT_DIR=C:\Project\QueensCareWebsite\next-app"
set "PORT=3000"
set "URL=http://localhost:%PORT%"
set "READY_TIMEOUT=120"

:: ── Step 1: Verify Project Folder ───────────────────────────
if not exist "%PROJECT_DIR%\package.json" (
    echo.
    echo  ╔══════════════════════════════════════════════════════╗
    echo  ║  ERROR: Queens Care project folder not found!        ║
    echo  ║                                                      ║
    echo  ║  Expected at:                                        ║
    echo  ║  %PROJECT_DIR%
    echo  ║                                                      ║
    echo  ║  Please update PROJECT_DIR in this launcher file.   ║
    echo  ╚══════════════════════════════════════════════════════╝
    echo.
    pause
    exit /b 1
)

:: ── Step 2: Verify Node.js / npm ────────────────────────────
where node >nul 2>&1
if errorlevel 1 (
    echo.
    echo  ╔══════════════════════════════════════════════════════╗
    echo  ║  ERROR: Node.js is not installed or not in PATH!    ║
    echo  ║                                                      ║
    echo  ║  Download Node.js from: https://nodejs.org          ║
    echo  ╚══════════════════════════════════════════════════════╝
    echo.
    pause
    exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
    echo.
    echo  ╔══════════════════════════════════════════════════════╗
    echo  ║  ERROR: npm is not found in PATH!                   ║
    echo  ║  Please reinstall Node.js from: https://nodejs.org  ║
    echo  ╚══════════════════════════════════════════════════════╝
    echo.
    pause
    exit /b 1
)

:: ── Step 3: Check if server is already running ──────────────
echo  Checking if Queens Care is already running on port %PORT%...
node -e "const h=require('http');h.get('%URL%',r=>{process.exit(0)}).on('error',()=>process.exit(1));" >nul 2>&1
if not errorlevel 1 (
    echo.
    echo  ╔══════════════════════════════════════════════════════╗
    echo  ║  Queens Care is already running!                    ║
    echo  ║  Opening browser at %URL%          ║
    echo  ╚══════════════════════════════════════════════════════╝
    echo.
    start "" "%URL%"
    echo  Browser launched. You can close this window.
    timeout /t 5 >nul
    exit /b 0
)

:: ── Step 4: Start the Dev Server ────────────────────────────
echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║          QUEENS CARE LABORATORIES                    ║
echo  ║          Local Development Server                    ║
echo  ╚══════════════════════════════════════════════════════╝
echo.
echo  Project : %PROJECT_DIR%
echo  URL     : %URL%
echo  Command : npm run dev
echo.
echo  Starting server... (please wait)
echo  ────────────────────────────────────────────────────────
echo.

cd /d "%PROJECT_DIR%"

:: Start npm run dev in the background, redirect its output to a temp file
::  AND keep piping it live to this console
set "LOGFILE=%TEMP%\queens-care-dev-log.txt"
if exist "%LOGFILE%" del "%LOGFILE%"

:: Launch dev server — inherits this terminal window so output stays visible
start "Queens Care Dev Server" /B cmd /c "npm run dev > "%LOGFILE%" 2>&1 && pause"

:: Also tail the log in this window
start "" /B powershell -NoProfile -Command "Get-Content '%LOGFILE%' -Wait"

:: ── Step 5: Wait for the server to become ready ─────────────
echo  Waiting for server to be ready on port %PORT%...
set "ELAPSED=0"

:WAIT_LOOP
timeout /t 2 >nul 2>&1
set /a ELAPSED+=2

node -e "const h=require('http');const req=h.request({hostname:'localhost',port:%PORT%,path:'/',method:'GET'},r=>{process.exit(0)});req.on('error',()=>process.exit(1));req.setTimeout(1500,()=>{req.abort();process.exit(1)});req.end();" >nul 2>&1
if not errorlevel 1 (
    goto SERVER_READY
)

if %ELAPSED% geq %READY_TIMEOUT% (
    echo.
    echo  ╔══════════════════════════════════════════════════════╗
    echo  ║  WARNING: Server did not respond in %READY_TIMEOUT% seconds.  ║
    echo  ║  It may still be starting. Trying to open browser.  ║
    echo  ╚══════════════════════════════════════════════════════╝
    goto OPEN_BROWSER
)

:: Show progress every 10 seconds
set /a MODCHECK=%ELAPSED% %% 10
if %MODCHECK%==0 (
    echo  Still waiting... (%ELAPSED%s elapsed)
)
goto WAIT_LOOP

:SERVER_READY
echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║  ✓ Queens Care is READY!                            ║
echo  ║  Opening browser at %URL%          ║
echo  ╚══════════════════════════════════════════════════════╝

:OPEN_BROWSER
echo.
start "" "%URL%"
echo  Browser opened. The server continues running in the background.
echo.
echo  ────────────────────────────────────────────────────────
echo   Queens Care Dev Server is running.
echo   DO NOT close this window — it keeps the server alive.
echo   To stop: press Ctrl+C or close this window.
echo  ────────────────────────────────────────────────────────
echo.

:: ── Step 6: Keep this terminal alive (tail the server log) ──
echo  [Server output below:]
echo.
powershell -NoProfile -Command "Get-Content '%LOGFILE%' -Wait"

endlocal

@echo off
REM ==============================================================================
REM NIAT Growth & Call-to-Close RL Sales Engine
REM Windows Batch Startup Script (run.bat)
REM ==============================================================================

setlocal enabledelayedexpansion
title NIAT Call-to-Close RL Sales Engine

echo ==============================================================================
echo   NIAT Call-to-Close RL Sales Engine & Career Assessment Platform
echo ==============================================================================
echo.

echo [STEP 1/5] Checking System Prerequisites...
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo   [OK] Node.js detected: %NODE_VER%

where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm is not installed or not in PATH.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm -v') do set NPM_VER=%%i
echo   [OK] npm detected:     v%NPM_VER%

echo.
echo [STEP 2/5] Checking Environment Configuration (.env)...
if not exist .env (
    if exist .env.example (
        echo   [!] Copying .env from .env.example...
        copy .env.example .env >nul
    ) else (
        echo   [!] Creating default .env...
        echo PORT=3000 > .env
        echo GEMINI_API_KEY= >> .env
        echo TELEGRAM_BOT_TOKEN= >> .env
    )
)
echo   [OK] .env configuration ready.

set PORT=3000
for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
    if "%%A"=="PORT" set PORT=%%B
)

echo.
echo [STEP 3/5] Verifying Dependencies...
if not exist node_modules (
    echo   [!] Installing node modules...
    call npm install
) else (
    echo   [OK] Dependencies verified.
)

echo.
echo [STEP 4/5] Inspecting Audio Test Library...
if exist samples (
    echo   [OK] Audio library detected in samples\ folder:
    for %%F in (samples\*.wav samples\*.mp3) do (
        echo     - %%~nxF (%%~zF bytes)
    )
)
if exist scripts (
    echo   [OK] NIAT working case audios in scripts\ folder:
    for %%F in (scripts\*.wav) do (
        echo     - %%~nxF (%%~zF bytes)
    )
)

echo.
echo [STEP 5/5] Launching Server...
echo ==============================================================================
echo   APPLICATION ACCESS URLS:
echo     - Track B (Sales Co-Pilot):  http://localhost:%PORT%/call-to-close.html
echo     - Track A (Career DNA):      http://localhost:%PORT%/index.html
echo     - Audio Catalog:             http://localhost:%PORT%/api/samples/list
echo     - API Health Status:         http://localhost:%PORT%/api/health
echo ==============================================================================
echo Press Ctrl+C to stop the server at any time.
echo.

node server.js

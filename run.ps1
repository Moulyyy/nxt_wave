# ==============================================================================
# NIAT Growth & Call-to-Close RL Sales Engine
# Native PowerShell Startup Script (run.ps1)
# ==============================================================================

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "  NIAT Call-to-Close RL Sales Engine & Career Assessment Platform" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

# STEP 1: Prerequisites
Write-Host "[STEP 1/5] Checking System Prerequisites..." -ForegroundColor Blue
try {
    $nodeVer = (node -v).Trim()
    Write-Host "  [OK] Node.js detected: $nodeVer" -ForegroundColor Green
} catch {
    Write-Host "  [ERROR] Node.js is not installed or not in PATH." -ForegroundColor Red
    Write-Host "  Please install Node.js (v18+) from https://nodejs.org/"
    exit 1
}

try {
    $npmVer = (npm -v).Trim()
    Write-Host "  [OK] npm detected:     v$npmVer" -ForegroundColor Green
} catch {
    Write-Host "  [ERROR] npm is not installed or not in PATH." -ForegroundColor Red
    exit 1
}

# STEP 2: Environment Configuration
Write-Host ""
Write-Host "[STEP 2/5] Checking Environment Configuration (.env)..." -ForegroundColor Blue
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Write-Host "  [!] .env not found. Copying from .env.example..." -ForegroundColor Yellow
        Copy-Item ".env.example" ".env"
    } else {
        Set-Content -Path ".env" -Value "PORT=3000`nGEMINI_API_KEY=`nTELEGRAM_BOT_TOKEN="
    }
}

$port = "3000"
if (Test-Path ".env") {
    $envLines = Get-Content ".env"
    foreach ($line in $envLines) {
        if ($line -match '^\s*PORT\s*=\s*(.+)$') {
            $port = $matches[1].Trim()
        }
        if ($line -match '^\s*GEMINI_API_KEY\s*=\s*(.+)$') {
            $k = $matches[1].Trim()
            if ($k.Length -gt 8) {
                $masked = $k.Substring(0, 6) + "..." + $k.Substring($k.Length - 4)
                Write-Host "  [OK] Gemini API Key configured: $masked" -ForegroundColor Green
            }
        }
        if ($line -match '^\s*TELEGRAM_BOT_TOKEN\s*=\s*(.+)$') {
            $tg = $matches[1].Trim()
            if ($tg.Length -gt 6) {
                Write-Host "  [OK] Telegram Bot Token configured: $($tg.Substring(0, 6))..." -ForegroundColor Green
            }
        }
    }
}
Write-Host "  [OK] Target HTTP Port:          $port" -ForegroundColor Green

# STEP 3: Dependencies
Write-Host ""
Write-Host "[STEP 3/5] Verifying Dependencies..." -ForegroundColor Blue
if (-not (Test-Path "node_modules")) {
    Write-Host "  Installing dependencies via npm install..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host "  [OK] All node dependencies verified." -ForegroundColor Green
}

# STEP 4: Inspect Audio Library & Scripts
Write-Host ""
Write-Host "[STEP 4/5] Inspecting Call Recordings & Audio Library..." -ForegroundColor Blue
if (Test-Path "samples") {
    $samples = Get-ChildItem -Path "samples" | Where-Object { $_.Extension -match '\.(wav|mp3)$' }
    Write-Host "  [OK] Found $($samples.Count) test call audio files in samples/:" -ForegroundColor Green
    foreach ($s in $samples) {
        $kb = [math]::Round($s.Length / 1024)
        Write-Host "    - $($s.Name) ($kb KB)" -ForegroundColor Cyan
    }
}
if (Test-Path "scripts") {
    $scriptsAudio = Get-ChildItem -Path "scripts" -Filter *.wav
    Write-Host "  [OK] Found $($scriptsAudio.Count) NIAT working case audio files in scripts/:" -ForegroundColor Green
    foreach ($sa in $scriptsAudio) {
        $kb = [math]::Round($sa.Length / 1024)
        Write-Host "    - $($sa.Name) ($kb KB)" -ForegroundColor Magenta
    }
}

# Check if server is already running on target port
$portInUse = $false
try {
    $conns = Get-NetTCPConnection -LocalPort ([int]$port) -State Listen -ErrorAction SilentlyContinue
    if ($conns) { $portInUse = $true }
} catch {}

if ($portInUse) {
    Write-Host ""
    Write-Host "==============================================================================" -ForegroundColor Green
    Write-Host "  SERVER IS ALREADY RUNNING AND ONLINE ON PORT $port!" -ForegroundColor Green
    Write-Host "==============================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Track B (Sales Co-Pilot):  http://localhost:$port/call-to-close.html" -ForegroundColor Cyan
    Write-Host "  Track A (Career DNA):      http://localhost:$port/index.html" -ForegroundColor Cyan
    Write-Host "  Audio Catalog:             http://localhost:$port/api/samples/list" -ForegroundColor Cyan
    Write-Host "  API Health Status:         http://localhost:$port/api/health" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "You can open the URLs above directly in your browser!" -ForegroundColor Yellow
    Write-Host "==============================================================================" -ForegroundColor Green
    exit 0
}

# STEP 5: Launch Server
Write-Host ""
Write-Host "[STEP 5/5] Launching Server..." -ForegroundColor Blue
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host "  APPLICATION ACCESS URLS:" -ForegroundColor White
Write-Host "    - Track B (Sales Co-Pilot):  http://localhost:$port/call-to-close.html" -ForegroundColor Cyan
Write-Host "    - Track A (Career DNA):      http://localhost:$port/index.html" -ForegroundColor Cyan
Write-Host "    - Audio Catalog:             http://localhost:$port/api/samples/list" -ForegroundColor Cyan
Write-Host "    - API Health Status:         http://localhost:$port/api/health" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the application at any time.`n" -ForegroundColor Yellow

node server.js

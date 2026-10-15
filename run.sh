#!/usr/bin/env bash
# ==============================================================================
# NIAT Growth & Call-to-Close RL Sales Engine
# Automated Startup & Validation Script (run.sh)
# Compatible with: Linux, macOS, WSL, and Windows Git Bash / MSYS
# ==============================================================================

set -e

# ANSI Color Palette
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Determine script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${CYAN}"
echo "=============================================================================="
echo "  _   _ _____    _  _____   ____ ____   _____        _______ _   _ "
echo " | \ | |_   _|  / \|_   _| / ___|  _ \ / _ \ \      / /_   _| | | |"
echo " |  \| | | |   / _ \ | |  | |  _| |_) | | | \ \ /\ / /  | | | |_| |"
echo " | |\  | | |  / ___ \| |  | |_| |  _ <| |_| |\ V  V /   | | |  _  |"
echo " |_| \_| |_| /_/   \_\_|   \____|_| \_\\___/  \_/\_/    |_| |_| |_|"
echo "                                                                      "
echo "  NIAT Call-to-Close RL Sales Engine & Career Assessment Platform     "
echo "=============================================================================="
echo -e "${NC}"

echo -e "${BLUE}[STEP 1/5] Checking System Prerequisites...${NC}"

# Check for Node.js
if ! command -v node >/dev/null 2>&1; then
    echo -e "${RED}[ERROR] Node.js is not installed or not in your PATH.${NC}"
    echo -e "Please install Node.js (v18 or newer) from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "  ${GREEN}✓${NC} Node.js detected: ${BOLD}${NODE_VERSION}${NC}"

# Check for npm
if ! command -v npm >/dev/null 2>&1; then
    echo -e "${RED}[ERROR] npm is not installed or not in your PATH.${NC}"
    exit 1
fi
NPM_VERSION=$(npm -v)
echo -e "  ${GREEN}✓${NC} npm detected:     ${BOLD}v${NPM_VERSION}${NC}"

echo -e "\n${BLUE}[STEP 2/5] Checking Environment Configuration (.env)...${NC}"
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo -e "  ${YELLOW}!${NC} .env file not found. Creating from .env.example..."
        cp .env.example .env
        echo -e "  ${GREEN}✓${NC} .env created from .env.example."
    else
        echo -e "  ${YELLOW}!${NC} Neither .env nor .env.example found. Creating default .env..."
        cat << 'EOF' > .env
PORT=3000
GEMINI_API_KEY=
TELEGRAM_BOT_TOKEN=
EOF
        echo -e "  ${GREEN}✓${NC} Default .env generated."
    fi
fi

# Load environment variables safely
if [ -f .env ]; then
    # Read PORT
    ENV_PORT=$(grep -E '^PORT=' .env | cut -d '=' -f2- | tr -d '\r' | tr -d ' ' || true)
    if [ -n "$ENV_PORT" ]; then
        PORT="$ENV_PORT"
    else
        PORT=3000
    fi

    # Check GEMINI_API_KEY
    GEMINI_KEY=$(grep -E '^GEMINI_API_KEY=' .env | cut -d '=' -f2- | tr -d '\r' | tr -d ' ' || true)
    if [ -n "$GEMINI_KEY" ]; then
        KEY_MASKED="${GEMINI_KEY:0:6}...${GEMINI_KEY: -4}"
        echo -e "  ${GREEN}✓${NC} Gemini API Key configured: ${BOLD}${KEY_MASKED}${NC}"
    else
        echo -e "  ${YELLOW}! WARNING: GEMINI_API_KEY is empty in .env. Sequential agentic AI will use pre-grounded fallbacks.${NC}"
    fi

    # Check TELEGRAM_BOT_TOKEN
    TG_TOKEN=$(grep -E '^TELEGRAM_BOT_TOKEN=' .env | cut -d '=' -f2- | tr -d '\r' | tr -d ' ' || true)
    if [ -n "$TG_TOKEN" ]; then
        TG_MASKED="${TG_TOKEN:0:6}...${TG_TOKEN: -4}"
        echo -e "  ${GREEN}✓${NC} Telegram Bot configured:   ${BOLD}${TG_MASKED}${NC}"
    else
        echo -e "  ${YELLOW}! Telegram Bot is optional. Configure TELEGRAM_BOT_TOKEN in .env to activate @rag1729bot.${NC}"
    fi
else
    PORT=3000
fi

echo -e "  ${GREEN}✓${NC} Target HTTP Port:          ${BOLD}${PORT}${NC}"

echo -e "\n${BLUE}[STEP 3/5] Verifying Dependencies...${NC}"
if [ ! -d "node_modules" ] || [ ! -f "package-lock.json" ]; then
    echo -e "  ${YELLOW}Node modules missing. Running npm install...${NC}"
    npm install
    echo -e "  ${GREEN}✓${NC} Dependencies successfully installed."
else
    echo -e "  ${GREEN}✓${NC} All node dependencies verified."
fi

echo -e "\n${BLUE}[STEP 4/5] Inspecting Call Recordings & Audio Test Library...${NC}"
if [ -d "samples" ]; then
    TOTAL_SAMPLES=$(ls -1 samples/*.wav samples/*.mp3 2>/dev/null | wc -l || true)
    echo -e "  ${GREEN}✓${NC} Found ${BOLD}${TOTAL_SAMPLES}${NC} call audio recording files in ${BOLD}samples/${NC}:"
    for file in samples/*; do
        if [ -f "$file" ]; then
            FNAME=$(basename "$file")
            FSIZE=$(ls -lh "$file" | awk '{print $5}')
            echo -e "    • ${CYAN}${FNAME}${NC} (${FSIZE})"
        fi
    done
fi

if [ -d "scripts" ]; then
    TOTAL_SCRIPTS=$(ls -1 scripts/*.wav 2>/dev/null | wc -l || true)
    echo -e "  ${GREEN}✓${NC} Found ${BOLD}${TOTAL_SCRIPTS}${NC} NIAT working case audio files in ${BOLD}scripts/${NC}:"
    for file in scripts/*.wav; do
        if [ -f "$file" ]; then
            FNAME=$(basename "$file")
            FSIZE=$(ls -lh "$file" | awk '{print $5}')
            echo -e "    • ${MAGENTA}${FNAME}${NC} (${FSIZE})"
        fi
    done
fi

# Check if server is already occupied on target port
PORT_BUSY=0
if command -v lsof >/dev/null 2>&1; then
    if lsof -Pi :${PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
        PORT_BUSY=1
    fi
elif command -v netstat >/dev/null 2>&1; then
    if netstat -an 2>/dev/null | grep -E "(:|\.)${PORT} " | grep -i "LISTEN" >/dev/null 2>&1; then
        PORT_BUSY=1
    fi
fi

if [ "$PORT_BUSY" -eq 1 ]; then
    echo -e "\n${YELLOW}⚡ NOTICE: Server is ALREADY RUNNING and active on port ${PORT}!${NC}"
    echo -e "${GREEN}==============================================================================${NC}"
    echo -e " ${BOLD}⚡ APPLICATION ACCESS URLS:${NC}"
    echo -e "   • ${BOLD}Track B (Sales Co-Pilot & Audio Engine):${NC}  ${CYAN}http://localhost:${PORT}/call-to-close.html${NC}"
    echo -e "   • ${BOLD}Track A (Career DNA Student Assessment):${NC}  ${CYAN}http://localhost:${PORT}/index.html${NC}"
    echo -e "   • ${BOLD}Audio Catalog & Direct Downloads:${NC}         ${CYAN}http://localhost:${PORT}/api/samples/list${NC}"
    echo -e "   • ${BOLD}API Health Status:${NC}                        ${CYAN}http://localhost:${PORT}/api/health${NC}"
    echo -e "${GREEN}==============================================================================${NC}"
    echo -e "You can open the URLs above directly in your browser!\n"
    exit 0
fi

echo -e "\n${BLUE}[STEP 5/5] Launching Server...${NC}"
echo -e "${GREEN}==============================================================================${NC}"
echo -e " ${BOLD}⚡ APPLICATION ACCESS URLS:${NC}"
echo -e "   • ${BOLD}Track B (Sales Co-Pilot & Audio Engine):${NC}  ${CYAN}http://localhost:${PORT}/call-to-close.html${NC}"
echo -e "   • ${BOLD}Track A (Career DNA Student Assessment):${NC}  ${CYAN}http://localhost:${PORT}/index.html${NC}"
echo -e "   • ${BOLD}Audio Catalog & Direct Downloads:${NC}         ${CYAN}http://localhost:${PORT}/api/samples/list${NC}"
echo -e "   • ${BOLD}API Health Status:${NC}                        ${CYAN}http://localhost:${PORT}/api/health${NC}"
echo -e "${GREEN}==============================================================================${NC}"
echo -e "${YELLOW}Press Ctrl+C at any time to gracefully stop the application.${NC}\n"

# Trap exit signals
cleanup() {
    echo -e "\n${YELLOW}[SHUTDOWN] Stopping NIAT Growth Engine...${NC}"
    exit 0
}
trap cleanup SIGINT SIGTERM

# Execute server
exec node server.js

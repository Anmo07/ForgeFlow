#!/bin/bash
# ==============================================================================
# ForgeFlow Application Build & Auto-Launcher
# ==============================================================================
# This script builds and starts the ForgeFlow full-stack application (FastAPI backend,
# Next.js frontend, PostgreSQL, Redis, MinIO, Nginx) and automatically opens the
# web application in your default web browser once ready.
# ==============================================================================

set -e

# Color definitions
BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Determine script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

# Ensure we are inside ForgeFlow project root
if [ -d "$SCRIPT_DIR/ForgeFlow" ]; then
    PROJECT_ROOT="$SCRIPT_DIR/ForgeFlow"
else
    PROJECT_ROOT="$SCRIPT_DIR"
fi

cd "$PROJECT_ROOT"

echo -e "${BLUE}${BOLD}"
echo "================================================================================"
echo "                   ⚙️  FORGEFLOW APPLICATION LAUNCHER                           "
echo "================================================================================"
echo -e "${NC}"

# Check for .env file
if [ ! -f "$PROJECT_ROOT/.env" ]; then
    if [ -f "$PROJECT_ROOT/.env.example" ]; then
        echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
        cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
        echo -e "${GREEN}✓ Created .env successfully.${NC}"
    else
        echo -e "${RED}❌ Error: Neither .env nor .env.example found!${NC}"
        exit 1
    fi
fi

# Function to launch URL in default browser
launch_browser() {
    local url="$1"
    echo -e "${CYAN}🚀 Launching Web Application in default browser: ${BOLD}$url${NC}"
    if command -v open >/dev/null 2>&1; then
        open "$url"
    elif command -v xdg-open >/dev/null 2>&1; then
        xdg-open "$url"
    elif command -v cmd.exe >/dev/null 2>&1; then
        cmd.exe /c start "$url"
    else
        echo -e "${YELLOW}Please open your browser manually at: $url${NC}"
    fi
}

# Function to check if a port or URL is responding
wait_for_url() {
    local url="$1"
    local name="$2"
    local max_attempts=60
    local attempt=1

    echo -e "${YELLOW}⏳ Waiting for $name to be ready at $url...${NC}"
    while [ $attempt -le $max_attempts ]; do
        if curl -s --head --request GET "$url" | grep -E "200|301|302|404" >/dev/null 2>&1 || curl -s "$url" >/dev/null 2>&1; then
            echo -e "${GREEN}✓ $name is UP and ready!${NC}"
            return 0
        fi
        sleep 1
        attempt=$((attempt + 1))
        echo -n "."
    done
    echo -e "\n${RED}⚠️ Warning: $name took longer than expected to respond.${NC}"
    return 1
}

# Mode selection: Docker vs Local Dev
USE_DOCKER=true

if ! command -v docker >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️ Docker is not installed. Falling back to local Node/Python dev server...${NC}"
    USE_DOCKER=false
elif ! docker info >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️ Docker daemon is not running. Falling back to local Node/Python dev server...${NC}"
    USE_DOCKER=false
fi

if [ "$USE_DOCKER" = true ]; then
    echo -e "${BLUE}🐳 Docker environment detected. Launching full containerized stack...${NC}\n"

    # Step 1: Start databases
    echo -e "${YELLOW}[1/5] Starting database services (Postgres, Redis, MinIO)...${NC}"
    docker compose --env-file .env -f infra/docker-compose.yml up -d postgres redis minio

    # Step 2: Wait for Postgres
    echo -e "${YELLOW}[2/5] Waiting for Postgres health check...${NC}"
    until [ "$(docker inspect --format='{{.State.Health.Status}}' forgeflow_postgres 2>/dev/null)" == "healthy" ]; do
        sleep 1
        echo -n "."
    done
    echo -e "\n${GREEN}✓ Postgres is healthy.${NC}"

    # Step 3: Database migrations & seed data
    echo -e "${YELLOW}[3/5] Building backend & running Alembic database migrations...${NC}"
    docker compose --env-file .env -f infra/docker-compose.yml build backend
    docker compose --env-file .env -f infra/docker-compose.yml run --rm \
      -e DATABASE_URL=postgresql+psycopg2://postgres:postgres@postgres:5432/forgeflow \
      backend alembic upgrade head || true

    echo -e "${YELLOW}[4/5] Seeding database with initial data...${NC}"
    docker compose --env-file .env -f infra/docker-compose.yml run --rm \
      -e DATABASE_URL=postgresql+psycopg2://postgres:postgres@postgres:5432/forgeflow \
      backend python scripts/seed_data.py || true

    # Step 4: Build and launch entire stack
    echo -e "${YELLOW}[5/5] Building & launching full application stack (Frontend, Backend, Celery, Nginx)...${NC}"
    docker compose --env-file .env -f infra/docker-compose.yml up -d --build

    TARGET_URL="http://localhost"
    ALT_URL="http://localhost:3000"

    wait_for_url "$TARGET_URL" "ForgeFlow Web Application" || wait_for_url "$ALT_URL" "ForgeFlow Frontend"

else
    echo -e "${BLUE}💻 Starting ForgeFlow in Local Development Mode...${NC}\n"

    # Start Backend
    echo -e "${YELLOW}Starting FastAPI Backend...${NC}"
    cd "$PROJECT_ROOT/backend"
    if [ ! -d ".venv" ]; then
        python3 -m venv .venv
        .venv/bin/pip install -r requirements.txt
    fi
    .venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!

    # Start Frontend
    echo -e "${YELLOW}Starting Next.js Frontend...${NC}"
    cd "$PROJECT_ROOT/frontend"
    if [ ! -d "node_modules" ]; then
        npm install --legacy-peer-deps
    fi
    npm run dev &
    FRONTEND_PID=$!

    TARGET_URL="http://localhost:3000"
    wait_for_url "$TARGET_URL" "ForgeFlow Next.js Application"
fi

echo ""
echo -e "${GREEN}${BOLD}================================================================================"
echo "              ✨ FORGEFLOW APPLICATION IS UP AND RUNNING!                       "
echo "================================================================================"
echo -e "${NC}"
echo -e "${BOLD}Active Endpoints:${NC}"
echo -e "  🌐  ${GREEN}Web Application (Nginx Gateway):${NC}  http://localhost:80"
echo -e "  💻  ${GREEN}Frontend Direct Access:${NC}         http://localhost:3000"
echo -e "  ⚡  ${GREEN}FastAPI Backend API:${NC}            http://localhost:8000"
echo -e "  📚  ${GREEN}Swagger API Documentation:${NC}      http://localhost:8000/docs"
echo -e "  🗄️   ${GREEN}MinIO Storage Console:${NC}          http://localhost:9001 (minioadmin/minioadmin)"
echo -e "  📊  ${GREEN}Prometheus Metrics:${NC}             http://localhost:9090"
echo -e "  ✉️   ${GREEN}Mailpit Email UI:${NC}               http://localhost:8025"
echo "================================================================================"
echo ""

# Auto launch browser
launch_browser "$TARGET_URL"

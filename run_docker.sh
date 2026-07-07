#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0;3m' # No Color

echo -e "${BLUE}=== Starting ForgeFlow Docker Orchestration ===${NC}"

# Ensure we are in the project root directory
cd "$(dirname "$0")"

# 1. Build and bring up core databases (postgres, redis, minio)
echo -e "${YELLOW}1. Starting databases (Postgres, Redis, MinIO)...${NC}"
docker compose --env-file .env -f infra/docker-compose.yml up -d postgres redis minio

# 2. Wait for Postgres to become healthy
echo -e "${YELLOW}2. Waiting for Postgres database to be healthy...${NC}"
until [ "$(docker inspect --format='{{.State.Health.Status}}' forgeflow_postgres 2>/dev/null)" == "healthy" ]; do
    echo -n "."
    sleep 1
done
echo -e "\n${GREEN}Postgres is healthy!${NC}"

# Build the backend image to ensure any config changes (like alembic.ini) are compiled
echo -e "${YELLOW}Building backend image...${NC}"
docker compose --env-file .env -f infra/docker-compose.yml build backend

# 3. Run migrations on backend
echo -e "${YELLOW}3. Running database migrations (Alembic)...${NC}"

docker compose --env-file .env -f infra/docker-compose.yml run --rm \
  -e DATABASE_URL=postgresql+psycopg2://postgres:postgres@postgres:5432/forgeflow \
  backend alembic upgrade head

# 4. Seed database
echo -e "${YELLOW}4. Seeding development database...${NC}"
docker compose --env-file .env -f infra/docker-compose.yml run --rm \
  -e DATABASE_URL=postgresql+psycopg2://postgres:postgres@postgres:5432/forgeflow \
  backend python scripts/seed_data.py

# 5. Build and bring up the rest of the stack
echo -e "${YELLOW}5. Launching the complete application stack (Backend, Frontend, Celery, Nginx, Prometheus)...${NC}"
docker compose --env-file .env -f infra/docker-compose.yml up -d --build

echo -e "${GREEN}=== ForgeFlow is fully containerized and running! ===${NC}"
echo -e "${BLUE}Services are mapped as follows:${NC}"
echo -e " - ${GREEN}Nginx Gateway (Proxy):${NC} http://localhost:80"
echo -e " - ${GREEN}Next.js Frontend:${NC}     http://localhost:3000"
echo -e " - ${GREEN}FastAPI Backend (API):${NC}  http://localhost:8000"
echo -e " - ${GREEN}FastAPI Swagger Docs:${NC}   http://localhost:8000/docs"
echo -e " - ${GREEN}MinIO Console (S3):${NC}     http://localhost:9001 (minioadmin / minioadmin)"
echo -e " - ${GREEN}Prometheus Metrics:${NC}     http://localhost:9090"

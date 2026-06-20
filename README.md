# ForgeFlow SaaS Platform

ForgeFlow is a production-grade B2B SaaS platform that integrates project management, CRM, and invoicing into a single portal.

## Architecture

This project is organized as a monorepo containing:
- **`frontend/`**: Next.js 15 App Router, TypeScript, Tailwind CSS v4, shadcn/ui, Framer Motion, Recharts.
- **`backend/`**: FastAPI (Python 3.12), SQLAlchemy 2.0, Alembic, Celery, Redis, PostgreSQL, MinIO.
- **`infra/`**: Docker Compose configurations, Nginx reverse proxy configuration, Prometheus configs.

## Getting Started

### Local Development Setup

#### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt email-validator pytest httpx
   ```
4. Run the development server:
   ```bash
   ./run_backend.sh
   ```

#### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Run the Next.js development server:
   ```bash
   npm run dev
   ```

### Running with Docker Compose

To run the entire stack locally using Docker Compose, navigate to the workspace root:

```bash
docker compose -f infra/docker-compose.yml up --build
```

This will boot:
- **Nginx** reverse proxy (accessible on `http://localhost`)
- **Next.js Frontend** (proxied through Nginx on `http://localhost/`)
- **FastAPI Backend** (proxied on `http://localhost/api`)
- **FastAPI OpenAPI docs** (available on `http://localhost/docs`)
- **PostgreSQL** database
- **Redis** broker
- **Celery Worker**
- **MinIO Object Storage** (console on `http://localhost:9001`)
- **Prometheus** (metrics portal on `http://localhost:9090`)

### Running Tests

To run the backend test suite:
```bash
PYTHONPATH=backend .venv/bin/pytest backend
```

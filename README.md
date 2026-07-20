# <p align="center"><img src="https://raw.githubusercontent.com/Anmo07/ForgeFlow/main/frontend/public/logo.png" onerror="this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80';this.style.borderRadius='12px'" width="80" height="80" alt="ForgeFlow Logo" /><br>⚙️ ForgeFlow</p>

<p align="center">
  <strong>The Unified Command Center & Billing Automation Engine for Modern MSPs</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/FastAPI-0.115.0-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Next.js-15.5.19-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/Tailwind_CSS_v4-4.3.1-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/PostgreSQL_16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Redis_7-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
</p>

---

## ⚡ What is ForgeFlow?

**ForgeFlow** is a production-grade, multi-tenant B2B SaaS platform specifically engineered for **Small and Medium IT Managed Service Providers (MSPs)** and IT Enterprise consultancies. It bridges the gap between engineering operations and back-office finance by consolidating project management, CRM opportunity tracking, client portals, and billing automation into a single, high-performance portal.

No more context-switching between bloated PSAs, disconnected CRM spreadsheets, and manual time trackers. Run your entire IT operations from one screen.

---

## ✨ Key Enterprise Capabilities

### 🛡️ Hardened Multi-Tenancy & Row-Level Security (RLS)
* **PostgreSQL Row-Level Security (RLS):** Database-enforced tenant boundaries (`SET LOCAL app.current_org_id = :org_id`) on all tenant tables (`projects`, `tasks`, `clients`, `leads`, `deals`, `invoices`, `attachments`), making cross-tenant data leaks structurally impossible.
* **Logical Tenant Isolation:** Dynamic tenant context extraction via `get_current_tenant` dependency. On client-side mock environments, custom interceptors isolate state database logs strictly by the selected tenant context.
* **Granular RBAC & Custom Roles:** Full organization-scoped custom roles with strict deletion safeguards (`409 Conflict` returned if assigned to active members).

### 🔒 Defense-in-Depth Security Controls
* **Modern Cryptography & Auth:** Argon2id password hashing via `argon2-cffi`, PyJWT authentication (`HS256`), secure HttpOnly SameSite session cookies, and encrypted MFA/TOTP setup with single-use backup codes.
* **API Rate Limiting & Account Lockout:** Redis-backed SlowAPI rate limiting decorated on critical auth endpoints, with exponential login lockout backoff delay.
* **Double-Submit CSRF & CORS Allowlist:** Enforced CSRF double-submit validation (`fastapi-csrf-protect`) on mutating HTTP verbs and strict origin CORS policy (`CORS_ALLOWED_ORIGINS`).
* **Bot Verification & Cloudflare Turnstile:** Turnstile bot protection on register/login flows with environment-safe test mode guards (`is_testing`).

### 💼 Automated MSP Billing Engine & Idempotency
* **Invoice Idempotency & Caching:** Redis-backed request idempotency (`Idempotency-Key` header) preventing duplicate billing transactions under concurrency.
* **PDF Billing Exporter & MinIO Presigned Storage:** Server-side PDF document compiler generating production-grade invoices stored in MinIO S3 object storage with presigned streaming downloads (`pdf_object_key`).
* **Dynamic Retainers & Seat Licensing:** Automated monthly retainers and seat count pricing directly connected to billing exports.

### 🔄 Concurrency Control & High Availability
* **Version-Based Optimistic Locking:** Version tracking on tasks and deals preventing concurrent overwrite conflicts (`version` checking & auto-increment).
* **Persona Switcher & Gatekeeping:** Build-time gated profile impersonation dropdown (`NEXT_PUBLIC_ENABLE_PERSONA_SWITCHER`) and isolated mock mode flag (`NEXT_PUBLIC_MOCK_MODE`).
* **Centralized Environment Testing Guards:** Unified `is_testing` runtime helper protecting production builds from mock pollution.

---

## 🏗️ Repository Architecture

ForgeFlow is organized as a lightweight, clean monorepo:

```text
├── frontend/          # Next.js 15 App Router, Tailwind CSS v4, Zustand, Recharts, Playwright E2E
├── backend/           # FastAPI (Python 3.12), SQLAlchemy 2.0 (Sync/RLS), Celery, Alembic, PyJWT
├── infra/             # Docker Compose stack, Nginx reverse proxy, Prometheus, Loki/Promtail
└── scripts/           # Seeding utilities, k6 load testing suite (k6_load_test.js), test tools
```

---

## 🚀 Getting Started

### 🐳 Running with Docker Compose (Recommended)

Boot up the entire stack locally (database, queues, object storage, monitoring, backend, and frontend) with a single command:

```bash
docker compose -f infra/docker-compose.yml up --build
```

#### Services Spawned:
* 🔑 **Nginx Reverse Proxy:** [http://localhost](http://localhost)
* 💻 **Next.js Frontend:** [http://localhost](http://localhost)
* ⚡ **FastAPI Backend:** [http://localhost/api](http://localhost/api) (OpenAPI docs at `/docs`)
* 🗄️ **MinIO Console:** [http://localhost:9001](http://localhost:9001)
* 📊 **Prometheus Metrics:** [http://localhost:9090](http://localhost:9090) (Nginx proxy restricted to `172.0.0.0/8`, `127.0.0.1`)

---

### 🛠️ Local Development Setup

#### 1. Backend API (FastAPI)
```bash
# Navigate to backend
cd backend

# Initialize & activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Start the dev server
./run_backend.sh
```

#### 2. Frontend Client (Next.js)
```bash
# Navigate to frontend
cd frontend

# Install packages
npm install --legacy-peer-deps

# Spin up Dev Server
npm run dev
```

---

## 🧪 Testing & Performance Suite

### Backend Integration & Unit Tests
```bash
PYTHONPATH=backend .venv/bin/pytest backend
```
Includes regression checks for PostgreSQL Row-Level Security, Celery task runners, invite flows, Turnstile token bypass in test mode, and cryptographic JWT/CSRF handlers.

### k6 Load Testing Benchmark
```bash
k6 run --env BASE_URL=http://localhost:8000 scripts/k6_load_test.js
```
Runs performance benchmarks verifying read/write P95/P99 latency SLAs and throughput under multi-stage concurrency ramp-up.

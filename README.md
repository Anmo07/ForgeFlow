# <p align="center"><picture><source media="(prefers-color-scheme: dark)" srcset=".github/assets/logo-white.png"><source media="(prefers-color-scheme: light)" srcset=".github/assets/logo-transparent.png"><img src=".github/assets/logo-transparent.png" width="380" alt="ForgeFlow Logo" /></picture></p>

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

## 🚀 Quick Start Guide (Run on Any Machine)

ForgeFlow is built for instant turnkey deployment on any fresh machine or server.

### Option A: Docker Deployment (Recommended)

Run the full containerized production stack (Nginx, Next.js, FastAPI, Celery, PostgreSQL, Redis, MinIO) with a single command:

```bash
git clone https://github.com/Anmo07/ForgeFlow.git
cd ForgeFlow
./run_docker.sh
```

Or using standard `docker compose`:

```bash
cp .env.example .env
docker compose -f infra/docker-compose.yml up --build -d
```

### Option B: Local Direct Setup (Auto-Bootstrapping)

If Docker is not available, launch directly with Python & Node.js. The launcher script will automatically create the virtual environment, install dependencies, initialize database schemas, and launch the dev servers:

```bash
git clone https://github.com/Anmo07/ForgeFlow.git
cd ForgeFlow
python3 Run_Application.py
```

*or via shell script:*

```bash
./run_application.sh
```

---

## 🌐 Active System Endpoints

Once running, the application services are mapped to the following local URLs:

| Service | Access URL | Description |
|---|---|---|
| **Web Application Gateway** | [http://localhost](http://localhost) | Nginx reverse proxy & frontend entry point |
| **Frontend Direct Access** | [http://localhost:3000](http://localhost:3000) | Next.js 15 App Router web client |
| **FastAPI Backend API** | [http://localhost:8000](http://localhost:8000) | REST API backend service |
| **Swagger API Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) | Interactive OpenAPI documentation |
| **MinIO Object Console** | [http://localhost:9001](http://localhost:9001) | S3 PDF storage manager (`minioadmin` / `minioadmin`) |
| **Mailpit Web UI** | [http://localhost:8025](http://localhost:8025) | Mock email server UI |
| **Prometheus Metrics** | [http://localhost:9090](http://localhost:9090) | System performance & telemetry metrics |

---

## ✨ Key Enterprise Capabilities

### 🛡️ Hardened Multi-Tenancy & Row-Level Security (RLS)
* **PostgreSQL Row-Level Security (RLS):** Database-enforced tenant boundaries (`SET LOCAL app.current_org_id = :org_id`) on all tenant tables (`projects`, `tasks`, `clients`, `leads`, `deals`, `invoices`, `attachments`), making cross-tenant data leaks structurally impossible.
* **Logical Tenant Isolation:** Dynamic tenant context extraction via `get_current_tenant` dependency. On client-side mock environments, custom interceptors isolate state database logs strictly by the selected tenant context.
* **Granular RBAC & Custom Roles:** Full organization-scoped custom roles with strict deletion safeguards (`409 Conflict` returned if assigned to active members).

### 🔒 Defense-in-Depth Security Controls
* **Modern Cryptography & Auth:** Argon2id password hashing via `argon2-cffi`, PyJWT authentication (`HS256`), secure HttpOnly SameSite session cookies, and encrypted MFA/TOTP setup with single-use backup codes.
* **Production Safety Guards:** Critical lifespan guard preventing application startup if `TESTING=True` is detected in production environments.
* **Content Security Policy:** Strict Nginx CSP header supporting Tailwind v4, Framer Motion, inline SVG glass filters, WebSockets, and Cloudflare Turnstile.
* **API Rate Limiting & Account Lockout:** Redis-backed SlowAPI rate limiting decorated on critical auth endpoints, with exponential login lockout backoff delay.
* **Double-Submit CSRF & CORS Allowlist:** Enforced CSRF double-submit validation (`fastapi-csrf-protect`) on mutating HTTP verbs and strict origin CORS policy (`CORS_ALLOWED_ORIGINS`).

### 💼 Automated MSP Billing Engine & Idempotency
* **Invoice Idempotency & Caching:** Redis-backed request idempotency (`Idempotency-Key` header) preventing duplicate billing transactions under concurrency.
* **PDF Billing Exporter & MinIO Presigned Storage:** Server-side PDF document compiler generating production-grade invoices stored in MinIO S3 object storage with presigned streaming downloads (`pdf_object_key`).
* **Dynamic Retainers & Seat Licensing:** Automated monthly retainers and seat count pricing directly connected to billing exports.

### 🔄 Concurrency Control & Architecture
* **Version-Based Optimistic Locking:** Version tracking on tasks and deals preventing concurrent overwrite conflicts (`version` checking & auto-increment).
* **Shared Custom Query Hooks:** React Query encapsulation hooks (`useProjects`, `useCRMClients`, `useCRMLeads`, `useCRMDeals`, `useInvoices`, `useOrgMembers`, `useOrgRoles`) with standardized `queryKeys` registry and typed `ApiError` handling.
* **Decomposed UI Component Tree:** Thin orchestrator page components (<150 lines) with isolated UI subcomponents.

---

## 🏗️ Repository Architecture

ForgeFlow is organized as a clean, lightweight monorepo:

```text
├── frontend/          # Next.js 15 App Router, Tailwind CSS v4, Zustand, TanStack Query, Recharts
├── backend/           # FastAPI (Python 3.12), SQLAlchemy 2.0, Celery, Alembic, PyJWT, Argon2
├── infra/             # Docker Compose stack, Nginx reverse proxy, Prometheus, Mailpit, MinIO
└── scripts/           # Database seeding utilities, k6 load testing suite (k6_load_test.js)
```

---

## 🧪 Testing & Verification

### Backend Unit & Integration Tests
```bash
cd backend
python3 -m pytest
```

### Bundle Size Analysis
```bash
cd frontend
npm run analyze
```

---

## 📜 License & Compliance

Designed for enterprise IT Operations, Managed Service Providers (MSPs), and SaaS platforms. Built with security, data isolation, and reliability at its core.

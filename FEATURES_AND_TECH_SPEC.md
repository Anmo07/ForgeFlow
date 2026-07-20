# ForgeFlow - Technical Features & Specifications

ForgeFlow is a production-grade, multi-tenant B2B SaaS platform specifically engineered for Managed Service Providers (MSPs) and IT consultancies. Below is the comprehensive technical breakdown of the platform's architecture, core feature modules, security controls, data integrity mechanisms, and software dependencies.

---

## 🛠️ Technology Stack & Architecture

ForgeFlow operates as a containerized, decoupled monorepo combining a modern Next.js 15 SPA client with an asynchronous FastAPI backend protected by PostgreSQL Row-Level Security (RLS).

```
                  ┌─────────────────────────────────┐
                  │      Client Browser (SPA)       │
                  │   Next.js 15 (React 18 / TS)    │
                  └────────────────┬────────────────┘
                                   │
                                   │ HTTPS REST / WebSockets / CSRF Cookie
                                   ▼
                  ┌─────────────────────────────────┐
                  │        FastAPI Gateway          │
                  │  Uvicorn / SlowAPI Rate Limit   │
                  └────────┬───────────────┬────────┘
                           │               │
      DB Queries + RLS     │               │ Publish Event / Cache Idempotency
      (SET LOCAL org_id)   ▼               ▼
                  ┌────────┴──────┐   ┌────┴────────────────┐
                  │ PostgreSQL 16 │   │  Redis Broker 7 /   │
                  │ (Main DB +RLS)│   │  Celery Workers     │
                  └───────────────┘   └─────────────────────┘
                           │
                           │ Object Storage
                           ▼
                  ┌─────────────────┐
                  │  MinIO (S3 SDK) │
                  │ Presigned PDFs  │
                  └─────────────────┘
```

* **Frontend**: Next.js 15 App Router SPA, TypeScript 5.4, Zustand (state persistence), Tailwind CSS v4, Lucide Icons, Recharts, and Playwright E2E framework.
* **Backend**: FastAPI (Python 3.12), SQLAlchemy 2.0 (Sync ORM with RLS transaction listeners), Celery (distributed async tasks), Alembic (schema migrations).
* **Datastore & Queues**: PostgreSQL 16 (transactional data with RLS enforced), Redis 7 (caching, rate limiting buckets, lockout counters, invoice idempotency), MinIO (S3-compatible object storage).
* **Infrastructure & Monitoring**: Docker Compose (non-root `USER forgeflow`), Nginx (Reverse Proxy & metric IP restrictions), Prometheus, Loki & Promtail log shipping.

---

## ✨ Core Feature Modules

### 1. Operations Overview (Dashboard)
* **Real-time Operational Metrics**: Dynamic widgets displaying live data for Active Projects, CRM Pipeline Opportunity Value, and Outstanding Invoices.
* **Audit Activity Feed**: Aggregated system event log tracking user activities, pipeline shifts, and billing actions.
* **Quick Navigation & Role Impersonation**: Header navigation linking to operational modules, with build-time gated `PersonaSwitcher` dropdown (`NEXT_PUBLIC_ENABLE_PERSONA_SWITCHER`).

### 2. CRM Opportunity Pipeline & Concurrency Control
* **Visual Stage Progression**: Pipeline column view covering Lead, Contacted, Proposal, Negotiation, Won, and Lost stages.
* **Deal Management & Versioning**: Create and edit deals with value tracking, probability calculation, and version-based optimistic locking (`version` field check) to prevent concurrent update overwrites.

### 3. Projects Kanban Board
* **Task Management**: Drag-and-drop Kanban interface for status tracking (To Do, In Progress, Review, Completed).
* **Optimistic Locking**: Task status updates execute version verification via `verify_version` and increment `version` on save.
* **Tenant Task Containment**: Query and event-level execution strictly limits visible project tasks to the active organization ID.

### 4. Financial Invoicing Engine
* **Interactive Invoice Wizard**: Multi-item invoice generation with subtotal calculation, tax application, and balance tracking.
* **Idempotency Protection**: Accepts `Idempotency-Key` headers on `POST /api/invoices`, storing cached creation responses in Redis under `idempotency:invoice:{org_id}:{key}` to block duplicate billing calls.
* **ReportLab PDF Exporter & MinIO Presigned Storage**: Compiles production-grade PDF invoices, uploads to MinIO under `pdf_object_key`, and serves secure streaming downloads via presigned authorization checks.

### 5. Multi-Tenant Organization Management & Setup Wizard
* **Provisioning Wizard**: Multi-step wizard at `/organizations/create` for setting up organization details, sector metadata, team invites, and auto-seeding mock roles and API keys.
* **Granular Custom Roles & RBAC**: Custom organization-scoped role builder (`POST /api/organizations/{org_id}/roles`).
* **Role Safety Safeguards**: Attempts to delete custom roles currently assigned to active members trigger a `409 Conflict` response with an explicit list of affected member accounts.

### 6. Enterprise Single Sign-On (SSO)
* **OIDC Google Integration**: Standard OIDC authentication flow endpoints (`GET /api/auth/sso/google/init` and `GET /api/auth/sso/google/callback`).
* **Tenant-Scoped SSO Config**: Allows organization administrators to specify custom OIDC Client ID, Secret, and Issuer URL in tenant settings.
* **Cookie-Based Sessions**: Issues HttpOnly, Secure, SameSite=Strict `access_token` session cookies.

---

## 🔒 Security & Privacy Engineering

### 1. PostgreSQL Row-Level Security (RLS) & Multi-Tenant Containment
* **PostgreSQL RLS Enforcement**: Database migration `7a0f6aa22806_enable_rls.py` enables RLS and `FORCE ROW LEVEL SECURITY` across all tenant tables (`projects`, `tasks`, `clients`, `leads`, `deals`, `invoices`, `attachments`).
* **SQLAlchemy Transaction Listener**: The `Session` class registers an `after_begin` event listener executing `SET LOCAL app.current_org_id = :org_id` on every transaction, making cross-tenant data leakage structurally impossible.
* **FastAPI Tenant Dependency**: Backend routes extract and validate organizational context using `get_current_tenant`.

### 2. Hardened Access Controls & Bot Defense
* **Argon2id Password Hashing**: Passwords stored using `argon2-cffi` algorithm.
* **PyJWT Token Validation**: JWT operations use `PyJWT==2.8.0` with explicit `HS256` signature enforcement (eliminating legacy `python-jose` vulnerability risks).
* **Rate Limiting & Account Lockout**: SlowAPI decorator on auth endpoints using Redis storage; exponential lockout backoff (`30s`, `60s`, `120s`, `300s`, `900s`) triggered on failed login/MFA attempts.
* **Double-Submit CSRF Protection**: Enforces CSRF token cookie checking via `fastapi-csrf-protect` on mutating HTTP methods (`POST`, `PUT`, `PATCH`, `DELETE`).
* **Cloudflare Turnstile Bot Defense**: Turnstile captcha verification on public register/login forms, featuring environment test-mode bypass guards (`is_testing`).

### 3. Container & Endpoint Hardening
* **Non-Root Docker User**: Backend runtime runs under non-privileged system user `USER forgeflow`.
* **Nginx Prometheus Access Restriction**: `/metrics` endpoint restricted exclusively to internal network `172.0.0.0/8` and `127.0.0.1`.
* **Strict CORS Allowlist**: Standardized `CORS_ALLOWED_ORIGINS` loading from environment variables.

---

## 📦 Software Dependency Specifications

### Frontend (Next.js Node Stack)
* **Framework**: `next` (15.5.19)
* **View Layer**: `react` (18.2.0), `react-dom` (18.2.0)
* **State Management**: `zustand` (4.5.0) - handles persistent auth cookies and organization context.
* **Design & Styling**: `tailwindcss` (4.3.1), `class-variance-authority` (0.7.1), `tailwind-merge` (3.6.0).
* **UI Components & Icons**: `lucide-react` (1.21.0), `radix-ui` (1.6.0), `framer-motion` (11.18.0).
* **Form Validation**: `react-hook-form` (7.50.0), `zod` (3.22.4).
* **Data Visualization & Tables**: `recharts` (2.12.4), `@tanstack/react-table` (8.15.3).
* **Query Caching**: `@tanstack/react-query` (5.28.0).
* **E2E Testing**: `@playwright/test` (1.42.1).

### Backend (FastAPI Python Stack)
* **API Engine**: `fastapi` (0.115.0), `uvicorn[standard]` (0.30.5)
* **Database ORM & Migrations**: `sqlalchemy` (2.0.35), `alembic` (1.13.2), `psycopg2-binary` (2.9.9)
* **Authentication & Cryptography**: `argon2-cffi` (23.1.0), `PyJWT` (2.8.0), `Authlib` (1.3.1), `passlib[bcrypt]` (1.7.4), `pyotp` (2.9.0)
* **Security & Rate Limiting**: `slowapi` (0.1.9), `fastapi-csrf-protect` (0.3.3)
* **Task Queuing & Caching**: `celery` (5.4.0), `redis` (5.0.5)
* **Object Storage SDK**: `minio` (7.2.7)
* **Document Compilation**: `reportlab` (4.2.5) - compiles invoice PDFs.
* **Observability**: `prometheus-client` (0.20.0)

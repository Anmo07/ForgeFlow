# ForgeFlow — Remediation Log

This log documents all security, architectural, data integrity, and reliability remediation actions carried out across the ForgeFlow codebase.

---

## Sprint A — Immediate Critical Fixes

### A1 — Replace `python-jose` with `PyJWT` (Active CVE Fix)
- **Changes**:
  - Removed `python-jose[cryptography]==3.3.0` from `backend/requirements.txt`.
  - Added `PyJWT==2.8.0` to `backend/requirements.txt`.
  - Updated `backend/app/common/security.py` to use `PyJWT`'s `jwt.encode` / `jwt.decode` API with explicit algorithm selection (`HS256`).
  - Added `--fail-on-vuln-found` flag to `pip-audit` in `.github/workflows/ci.yml` to automatically fail CI builds on vulnerable dependencies.
- **Files Touched**:
  - [backend/requirements.txt](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/requirements.txt)
  - [backend/app/common/security.py](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/app/common/security.py)
  - [.github/workflows/ci.yml](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/.github/workflows/ci.yml)
- **Tests Added/Modified**: Authentication and token validation tests validated against the new `PyJWT` implementation.

### A2 — Gate the Persona Switcher out of Production Builds
- **Changes**:
  - Extracted User Switcher UI logic and mock handlers from `Header` into standalone component `PersonaSwitcher`.
  - Wrapped `PersonaSwitcher` rendering behind `process.env.NEXT_PUBLIC_ENABLE_PERSONA_SWITCHER === "true"`.
  - Dynamically imported `PersonaSwitcher` inside `header.tsx` with SSR disabled and tree-shaking support.
  - Added `NEXT_PUBLIC_ENABLE_PERSONA_SWITCHER=false` to `.env.example`.
- **Files Touched**:
  - [frontend/components/ui/persona-switcher.tsx](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/frontend/components/ui/persona-switcher.tsx)
  - [frontend/components/ui/header.tsx](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/frontend/components/ui/header.tsx)
  - [.env.example](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/.env.example)

### A3 — Isolate Mock Interceptor / Client-Side Org Scoping from Production
- **Changes**:
  - Gated global fetch interceptor behind `process.env.NEXT_PUBLIC_MOCK_MODE === "true"`.
  - Configured `apiFetch` in non-mock mode to throw network/HTTP errors rather than falling back to local mock data.
  - Added runtime warning (`console.error`) issuing a security notice if `NEXT_PUBLIC_MOCK_MODE=true` is loaded in production.
- **Files Touched**:
  - [frontend/lib/api.ts](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/frontend/lib/api.ts)
  - [.env.example](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/.env.example)

### A4 — Audit and Fix the Zustand Auth Store
- **Changes**:
  - Removed `refreshToken` from Zustand store state and persistence interface.
  - Restricted client-side cookie writing in `auth.ts` to `NEXT_PUBLIC_MOCK_MODE === "true"`.
  - Configured `partialize` on Zustand persist middleware to ensure only non-sensitive profile fields (`user`, `isAuthenticated`) persist to `localStorage`.
- **Files Touched**:
  - [frontend/store/auth.ts](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/frontend/store/auth.ts)

### A5 — Fix the Async ORM / Driver Mismatch
- **Decision & Architecture**:
  - Standardized on synchronous database execution pattern using synchronous SQLAlchemy `SessionLocal` and `psycopg2-binary`.
  - Prevents blocking event loops on FastAPI as FastAPI handles synchronous route handlers in an internal threadpool by design.
- **Files Touched**:
  - [backend/app/common/database.py](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/app/common/database.py)

---

## Sprint B — Security Completions

### B1 — Rate Limiting and Account Lockout
- **Changes**:
  - Integrated `slowapi==0.1.9` rate limiter utilizing `REDIS_URL` as storage backend.
  - Decorated register, login, forgot-password, reset-password, and MFA verify routes with rate limiters.
  - Implemented Redis-based login lockout counters (`login_fail:{user_id}`) with exponential backoff delay (`30s`, `60s`, `120s`, `300s`, `900s`).
- **Files Touched**:
  - [backend/app/common/rate_limit.py](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/app/common/rate_limit.py)
  - [backend/app/auth/router.py](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/app/auth/router.py)
  - [backend/app/auth/lockout.py](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/app/auth/lockout.py)

### B2 — CSRF Double-Submit Cookie Protection
- **Changes**:
  - Added `fastapi-csrf-protect==0.3.3` to backend requirements.
  - Updated middleware to enforce double-submit CSRF cookie checks on mutating HTTP verbs (`POST`, `PUT`, `PATCH`, `DELETE`) with `SameSite=Strict` and `Secure=True`.
- **Files Touched**:
  - [backend/app/common/middleware.py](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/app/common/middleware.py)

### B3 — CORS Allowlist Hardening
- **Changes**:
  - Replaced wildcard CORS settings with comma-separated origin allowlist `CORS_ALLOWED_ORIGINS` loaded from environment variables.
  - Explicitly added `Authorization` header support and restricted permitted HTTP methods.
- **Files Touched**:
  - [backend/app/common/config.py](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/app/common/config.py)
  - [backend/app/main.py](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/app/main.py)

### B4 — AI Telemetry Consent Clause Cleanup
- **Changes**:
  - Clarified terms and removed conflicting clauses claiming arbitrary AI training access over customer operational data from privacy policy pages.
- **Files Touched**:
  - [frontend/app/privacy/page.tsx](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/frontend/app/privacy/page.tsx)

### B5 — MinIO Presigned URLs & Key Migration
- **Changes**:
  - Migrated `pdf_url` DB column to `pdf_object_key` on `Invoice` model via Alembic migration `6ee04aa22805_rename_pdf_url_to_pdf_object_key.py`.
  - Updated invoice download routes to verify tenant membership and issue presigned streaming downloads from MinIO.
- **Files Touched**:
  - [backend/app/invoices/models.py](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/app/invoices/models.py)
  - [backend/app/invoices/service.py](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/app/invoices/service.py)

### B6 — Prometheus Metric Endpoint Protection
- **Changes**:
  - Configured Nginx proxy rules restricting `/metrics` route access exclusively to internal subnets (`172.0.0.0/8` and `127.0.0.1`).
- **Files Touched**:
  - [infra/nginx.conf](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/infra/nginx.conf)

---

## Sprint D — Architecture & Data Integrity

### D1 — PostgreSQL Row-Level Security (RLS) Enforcement
- **Changes**:
  - Added migration script `7a0f6aa22806_enable_rls.py` enabling RLS and `FORCE ROW LEVEL SECURITY` on all tenant-scoped tables (`projects`, `tasks`, `clients`, `leads`, `deals`, `invoices`, `attachments`).
  - Added SQLAlchemy `after_begin` session event listener executing `SET LOCAL app.current_org_id = :org_id` on every active database transaction.
- **Files Touched**:
  - [backend/app/common/database.py](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/app/common/database.py)
  - [backend/alembic/versions/7a0f6aa22806_enable_rls.py](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/alembic/versions/7a0f6aa22806_enable_rls.py)

### D2 — Version-Based Optimistic Concurrency Control
- **Changes**:
  - Added `version` field tracking to `TaskUpdate`, `TaskResponse`, `DealUpdate`, and `DealResponse` schemas.
  - Implemented version checks (`verify_version`) and automatic version increments (`increment_version`) on updates to prevent concurrent overwrite state conflicts.
- **Files Touched**:
  - [backend/app/projects/service.py](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/app/projects/service.py)
  - [backend/app/crm/service.py](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/app/crm/service.py)

### D3 — Invoice Creation Idempotency
- **Changes**:
  - Configured `POST /api/invoices` endpoint to accept `Idempotency-Key` headers.
  - Implemented Redis response caching under `idempotency:invoice:{org_id}:{key}`, returning stored creation responses on duplicate API calls.
- **Files Touched**:
  - [backend/app/invoices/router.py](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/app/invoices/router.py)

### D4 — List Endpoint Pagination Limits
- **Changes**:
  - Restricted maximum `limit` query parameters across all router list endpoints to a maximum cap of `100` items per page.
- **Files Touched**:
  - All router endpoints under `backend/app/`.

### D5 — Non-Root Docker Image Hardening
- **Changes**:
  - Updated `backend/Dockerfile` to create non-privileged system user `forgeflow` and execute application container operations under `USER forgeflow`.
- **Files Touched**:
  - [backend/Dockerfile](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/Dockerfile)

---

## Sprint E — Reliability & Testing Enhancements

### E1 — Centralized Environment Helper & Production Safety Guard
- **Changes**:
  - Created centralized `is_testing()` utility function in `backend/app/common/config.py` unifying environment detection across pytest, Playwright, and local dev.
  - Implemented production safety guard raising runtime error if test mode flag is accidentally detected in production environments.
- **Files Touched**:
  - [backend/app/common/config.py](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/app/common/config.py)

### E2 — Cloudflare Turnstile Test Mode Support
- **Changes**:
  - Integrated mock Turnstile token validation support when `is_testing()` is true, permitting automated Playwright E2E tests to execute login and registration flows seamlessly.
- **Files Touched**:
  - [frontend/app/login/page.tsx](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/frontend/app/login/page.tsx)
  - [frontend/app/register/page.tsx](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/frontend/app/register/page.tsx)

### E3 — E2E Test Suite Locator & Stability Refactoring
- **Changes**:
  - Resolved Playwright strict mode locator violations by updating task form and Kanban board selectors in `frontend/tests-e2e/e2e-flows.spec.ts`.
  - Refactored seed data scripts (`backend/scripts/seed_test_org.py`) for deterministic state resets before test execution.
- **Files Touched**:
  - [frontend/tests-e2e/e2e-flows.spec.ts](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/frontend/tests-e2e/e2e-flows.spec.ts)
  - [backend/scripts/seed_test_org.py](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/scripts/seed_test_org.py)

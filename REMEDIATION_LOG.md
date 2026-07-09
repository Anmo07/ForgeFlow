# ForgeFlow — Remediation Log

This log documents all security and architectural remediation actions carried out across the codebase.

---

## Sprint A — Immediate Critical Fixes

### A1 — Replace `python-jose` with `PyJWT` (Active CVE Fix)
- **Changes**:
  - Removed `python-jose[cryptography]==3.3.0` from `backend/requirements.txt`.
  - Added `PyJWT==2.8.0` to `backend/requirements.txt`.
  - Updated `backend/app/common/security.py` to use `PyJWT`'s `jwt.encode` / `jwt.decode` API with an explicit algorithm selection (`HS256`).
  - Added `--fail-on-vuln-found` flag to `pip-audit` in `.github/workflows/ci.yml` to automatically fail builds on vulnerable dependencies.
- **Files Touched**:
  - [backend/requirements.txt](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/requirements.txt)
  - [backend/app/common/security.py](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/app/common/security.py)
  - [.github/workflows/ci.yml](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/.github/workflows/ci.yml)
- **Tests Added/Modified**: Existing tests covering authentication and token validation were validated against the new `PyJWT` implementation.

### A2 — Gate the Persona Switcher out of Production Builds
- **Changes**:
  - Extracted the User Switcher dropdown/button UI logic, local state, and mock switching handlers from `Header` into a new standalone client component `PersonaSwitcher`.
  - Wrapped `PersonaSwitcher` rendering behind the `process.env.NEXT_PUBLIC_ENABLE_PERSONA_SWITCHER === "true"` build-time flag.
  - Dynamically imported `PersonaSwitcher` inside `header.tsx` with SSR disabled and rendered it conditionally to ensure Next.js build-time tree-shaking completely removes it from the bundle when the environment flag is disabled.
  - Added `NEXT_PUBLIC_ENABLE_PERSONA_SWITCHER=false` to `.env.example`.
- **Files Touched**:
  - [frontend/components/ui/persona-switcher.tsx](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/frontend/components/ui/persona-switcher.tsx) [NEW]
  - [frontend/components/ui/header.tsx](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/frontend/components/ui/header.tsx)
  - [.env.example](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/.env.example)
  - [.env](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/.env)

### A3 — Isolate Mock Interceptor / Client-Side Org Scoping from Production
- **Changes**:
  - Gated the global mock fetch interceptor (which intercepts `/api/` calls in the browser) behind `process.env.NEXT_PUBLIC_MOCK_MODE === "true"`.
  - Configured `apiFetch` in non-mock mode to throw network/HTTP errors rather than falling back to local mock data.
  - Added a runtime warning (`console.error`) that issues a security notice if `NEXT_PUBLIC_MOCK_MODE=true` is loaded in a non-development environment.
  - Added `NEXT_PUBLIC_MOCK_MODE=false` to `.env.example`.
- **Files Touched**:
  - [frontend/lib/api.ts](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/frontend/lib/api.ts)
  - [.env.example](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/.env.example)
  - [.env](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/.env)

### A4 — Audit and Fix the Zustand Auth Store
- **Changes**:
  - Removed `refreshToken` from the Zustand store's state, interface, and mutation logic.
  - Wrapped `document.cookie` setting/clearing in `setAuth` and `clearAuth` inside `auth.ts` to only execute when `NEXT_PUBLIC_MOCK_MODE === "true"`. This prevents manual cookie writes when the server is managing session cookies over HTTP-only/SameSite headers.
  - Applied the `partialize` configuration to Zustand's persist middleware, ensuring that only the safe profile display fields (`user` and `isAuthenticated`) are stored in `localStorage`.
- **Files Touched**:
  - [frontend/store/auth.ts](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/frontend/store/auth.ts)

### A5 — Fix the Async ORM / Driver Mismatch
- **Decision & Architecture**:
  - Chosen consistent **synchronous** database handler pattern.
  - The application codebase is already structured around synchronous `def` routes and synchronous SQLAlchemy `SessionLocal` queries using `psycopg2-binary`.
  - This avoids blocking event loops on FastAPI as FastAPI runs synchronous route handlers in an internal threadpool by design.
  - Avoided introducing asyncpg/async ORM complexity where all handlers are already written synchronously.
- **Files Checked**:
  - [backend/app/common/database.py](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/app/common/database.py)
  - All router endpoints under `backend/app/` audited.

---

## Sprint B — Security Completions

### B1 — Rate Limiting and Account Lockout
- **Changes**:
  - Integrated `slowapi==0.1.9` rate limiter utilizing `REDIS_URL` as storage.
  - Decorated register, login, forgot-password, reset-password, and MFA verify routes with SlowAPI rate limiters.
  - Implemented Redis-based login lockout counters (`login_fail:{user_id}`) with exponential backoff delay (`30s, 60s, 120s, 300s, 900s`).
  - Added lockout checks and failed increments to MFA verification and reset-password endpoints, returning consistent `401` responses on credential failures.
- **Files Touched**:
  - [backend/requirements.txt](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/requirements.txt)
  - [backend/app/common/rate_limit.py](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/app/common/rate_limit.py)
  - [backend/app/auth/router.py](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/app/auth/router.py)
  - [backend/app/auth/service.py](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/app/auth/service.py)
  - [backend/app/auth/lockout.py](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/app/auth/lockout.py)

### B2 — CSRF Protection
- **Changes**:
  - Added `fastapi-csrf-protect==0.3.3` to backend requirements.
  - Updated `CSRFMiddleware` to enforce double-submit CSRF cookie checks on all mutating HTTP verbs (`POST`, `PUT`, `PATCH`, `DELETE`) with `samesite='strict'` and `secure=True`.
  - Added `X-Test-CSRF-Validation` header check to trigger CSRF validation under pytest testing environments.
- **Files Touched**:
  - [backend/app/common/middleware.py](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/app/common/middleware.py)

### B3 — CORS Allowlist Hardening
- **Changes**:
  - Replaced wildcard CORS settings with a comma-separated list `CORS_ALLOWED_ORIGINS` loaded from environment variables.
  - Restricted CORS allowed headers and methods exactly to the system's requirements.
- **Files Touched**:
  - [backend/app/common/config.py](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/app/common/config.py)
  - [backend/app/main.py](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/app/main.py)
  - [.env.example](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/.env.example)
  - [.env](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/.env)

### B4 — AI Telemetry Consent Clause Fix
- **Changes**:
  - Removed AI training clauses claiming access to customer operational and business metrics from the Privacy page.
- **Files Touched**:
  - [frontend/app/privacy/page.tsx](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/frontend/app/privacy/page.tsx)

### B5 — MinIO Presigned URLs
- **Changes**:
  - Renamed `pdf_url` DB column to `pdf_object_key` on `Invoice` model.
  - Added Alembic migration script `6ee04aa22805_rename_pdf_url_to_pdf_object_key.py`.
  - Updated invoices services and download routes to check tenant permissions and stream PDF bytes securely.
- **Files Touched**:
  - [backend/app/invoices/models.py](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/app/invoices/models.py)
  - [backend/app/invoices/repository.py](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/app/invoices/repository.py)
  - [backend/app/invoices/service.py](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/app/invoices/service.py)
  - [backend/alembic/versions/6ee04aa22805_rename_pdf_url_to_pdf_object_key.py](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/alembic/versions/6ee04aa22805_rename_pdf_url_to_pdf_object_key.py) [NEW]

### B6 — Prometheus Endpoint Protection
- **Changes**:
  - Restricted `/metrics` Nginx route access to internal range `172.0.0.0/8` and `127.0.0.1`.
- **Files Touched**:
  - [infra/nginx.conf](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/infra/nginx.conf)

---

## Sprint D — Architecture & Data Integrity

### D1 — Row-Level Security (RLS)
- **Changes**:
  - Created a database migration script `7a0f6aa22806_enable_rls.py` to enable PostgreSQL Row-Level Security and Force RLS on all tenant-scoped tables (`projects`, `tasks`, `clients`, `leads`, `deals`, `invoices`, `attachments`).
  - Added a transaction-level event listener (`after_begin`) to the SQLAlchemy `Session` class to automatically execute `SET LOCAL app.current_org_id = :org_id` on PostgreSQL database sessions, ensuring seamless tenant isolation.
- **Files Touched**:
  - [backend/app/common/database.py](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/app/common/database.py)
  - [backend/alembic/versions/7a0f6aa22806_enable_rls.py](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/alembic/versions/7a0f6aa22806_enable_rls.py) [NEW]

### D2 — Version-Based Optimistic Locking
- **Changes**:
  - Modified `TaskUpdate`, `TaskResponse`, `DealUpdate`, and `DealResponse` schemas to include `version`.
  - Updated task and deal services to perform version verification via `verify_version` and increment versions via `increment_version` during drag-and-drop status or details updates, preventing concurrent modification conflicts.
- **Files Touched**:
  - [backend/app/projects/schema.py](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/app/projects/schema.py)
  - [backend/app/crm/schema.py](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/app/crm/schema.py)
  - [backend/app/projects/service.py](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/app/projects/service.py)
  - [backend/app/crm/service.py](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/app/crm/service.py)

### D3 — Invoice Idempotency
- **Changes**:
  - Configured `POST /api/invoices` to accept an `Idempotency-Key` header.
  - Implemented Redis-based caching of successful invoice creation responses under key `idempotency:invoice:{org_id}:{key}`, returning the cached response on duplicate submissions to prevent double billing.
- **Files Touched**:
  - [backend/app/invoices/router.py](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/app/invoices/router.py)

### D4 — Pagination Hardening
- **Changes**:
  - Updated all router list endpoints (`list_clients`, `list_leads`, `list_deals`, `list_projects`, `list_invoices`, `list_orgs`, `list_org_api_keys`, `list_org_members`) to restrict maximum page size limits to exactly `100` instead of `1000`.
- **Files Touched**:
  - [backend/app/crm/router.py](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/app/crm/router.py)
  - [backend/app/projects/router.py](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/app/projects/router.py)
  - [backend/app/invoices/router.py](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/app/invoices/router.py)
  - [backend/app/organizations/router.py](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/app/organizations/router.py)
  - [backend/app/api_keys/router.py](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/app/api_keys/router.py)
  - [backend/app/memberships/router.py](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/app/memberships/router.py)

### D5 — Non-Root Docker Hardening
- **Changes**:
  - Updated `backend/Dockerfile` to create a non-root system user `forgeflow`, configure ownership of `/app`, and execute the application under `USER forgeflow`.
- **Files Touched**:
  - [backend/Dockerfile](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/Dockerfile)

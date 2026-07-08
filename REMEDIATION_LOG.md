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

# ForgeFlow Debug Report

**Date:** July 17, 2026  
**Investigation scope:** Navigation + data storage

## 1. Mock Interceptor Status

- **NEXT_PUBLIC_MOCK_MODE value:** `true` (from repo root `.env`)
- **Mock interceptor truly disabled:** **NO** — mock mode is explicitly enabled
- **Intercepted URL patterns (global fetch patch when MOCK_MODE=true):**
  - `/api/roles/organization/*` (GET, POST to `/api/roles/`)
  - `/api/permissions/*`
  - `/api/memberships/organization/*`, `/api/memberships/invite`, `/api/memberships/*/role`, DELETE `/api/memberships/*`
  - `/api/sessions/` (GET, DELETE)
  - `/api/activity-logs/*`
  - `/api/api-keys/organization/*`, POST `/api/api-keys/`, DELETE/rotate `/api/api-keys/*`
- **Data storage location when mock active:**
  - `localStorage` keys: `forgeflow_custom_roles_{orgId}`, `forgeflow_custom_members_{orgId}`, `forgeflow_custom_sessions_{orgId}`, `forgeflow_custom_logs_{orgId}`, `forgeflow_custom_keys_{orgId}`, `forgeflow_custom_organizations`, `forgeflow_users`
  - Zustand persist: `forgeflow-auth`, `forgeflow-organization`, `forgeflow-theme`
- **Fallback behavior when real API fails:**
  - `apiFetch()` in `frontend/lib/api.ts` lines 332–346: when `NEXT_PUBLIC_MOCK_MODE === "true"`, network errors AND non-OK HTTP responses fall back to `getMockDataForPath()` which returns hardcoded demo data for projects, CRM, invoices, organizations, memberships
  - Login page (`frontend/app/login/page.tsx` lines 98–117): on backend login failure, falls back to `localStorage` user matching (`forgeflow_users`)
  - Auth store sets `mock-access-token` cookie when no real token provided

## 2. Data in PostgreSQL

- **Backend health:** `http://localhost:8000/api/health/live` returns `{"status":"ok"}`
- **PostgreSQL counts:** Could not verify — Docker postgres container not reachable from this environment
- **Assessment:** With `NEXT_PUBLIC_MOCK_MODE=true`, user-created CRM/projects/invoices data likely never reaches PostgreSQL when API calls fail or are intercepted. Settings data (roles, members, sessions, audit logs, API keys) is **definitely** stored in localStorage via the fetch interceptor.

## 3. Zustand Stores

### auth.ts
- **State fields:** `user`, `isAuthenticated`
- **Fields persisted to localStorage:** `user`, `isAuthenticated` (key: `forgeflow-auth`)
- **Confirmed no tokens persisted:** YES — tokens not in `partialize`
- **Issue:** `setAuth()` sets client-side `access_token` cookie with fallback `"mock-access-token"` when no token passed

### layout.ts
- **Fields persisted:** Not persisted (in-memory only: `isSidebarOpen`)
- **Potential for stale navigation state:** NO

### organization.ts
- **Fields persisted:** `currentOrg` (key: `forgeflow-organization`)
- **Includes org context:** YES — full org object with `id`, `uuid`, `name`, `slug`

### theme.ts
- **Persisted:** `theme` (key: `forgeflow-theme`)

### toast.ts
- **Not persisted** (in-memory)

## 4. localStorage Contents (from browser console)

Manual step required — run in browser DevTools:

```javascript
Object.keys(localStorage).forEach(key => {
  console.log(`KEY: ${key}`);
  try { console.log(JSON.parse(localStorage.getItem(key))); }
  catch { console.log(localStorage.getItem(key)); }
});
```

Expected keys when mock mode has been used:
- `forgeflow-auth`, `forgeflow-organization`, `forgeflow-theme`
- `forgeflow_custom_roles_*`, `forgeflow_custom_members_*`, `forgeflow_custom_sessions_*`, `forgeflow_custom_logs_*`, `forgeflow_custom_keys_*`
- `forgeflow_custom_organizations`, `forgeflow_users`
- `forgeflow_last_email`, `forgeflow_last_password` (login page stores credentials)

## 5. TanStack Query

- **Query keys include org_id:** **SOME** — CRM and Invoices pages include `currentOrg?.id` in query keys; Dashboard and Projects use manual `useState` + `useEffect` instead of TanStack Query
- **staleTime setting:** 30,000ms (30 seconds) in `frontend/lib/query-client.ts`
- **Cache cleared on org switch:** **NO** — org switcher only dispatches `orgChanged` custom event; no `queryClient.clear()` or global invalidation

## 6. Navigation Links

- **All internal links use `<Link>`:** YES (sidebar, settings layout, dashboard, projects)
- **Internal `<a href>` found (bugs):** None in `frontend/app/`; login page has `<a href="/api/auth/sso/google/init">` (external OAuth init — acceptable)
- **Sidebar uses usePathname() for active state:** YES — prefix match: `pathname === item.href || pathname.startsWith(item.href + "/")`

## 7. Dynamic Routes

- **Routes found:** `/projects/[id]`
- **Parameter access:** `useParams()` in client component (correct for client-side)
- **Data fetch on mount:** YES — `fetchProjectDetails()` when `currentOrg` and `id` available
- **Error handling:** Shows "Project Not Found" on error; no dedicated `not-found.tsx` or `loading.tsx`
- **Potential break on direct URL access:** If `currentOrg` is null during hydration (Zustand persist not yet rehydrated), fetch is skipped until org loads — may show loading then error briefly

## 8. Middleware

- **File location:** `frontend/middleware.ts`
- **Protected route patterns:** All routes except `/`, `/login/*`, `/register/*`, `/features/*`, `/terms/*`, `/privacy/*`, `/api/auth/*`, `/health`, static assets
- **Public route patterns:** Landing, auth, features, terms, privacy
- **Auth check mechanism:** HTTP cookie `access_token` (not Zustand)
- **Redirect loops possible:** **Partial issue** — authenticated users visiting `/login` redirect to `/` (landing), not `/dashboard`. No infinite loop, but poor UX
- **Missing from matcher:** `/organizations/create` is protected (requires token) — correct

## 9. Org Switcher

- **Updates Zustand store:** YES — `setCurrentOrg(org)`
- **X-Organization-ID header:** Set per-request via `apiFetch({ orgId })` — NOT automatic from store; each call must pass `orgId` explicitly
- **TanStack Query invalidated on switch:** NO — only `window.dispatchEvent("orgChanged")`
- **Navigation after switch:** Client-side state update only (no navigation, no cache clear)
- **Dashboard org switch:** Dashboard does NOT listen to `orgChanged` — only re-fetches when `currentOrg` changes via useEffect dependency

## 10. Root Cause Hypotheses (rank in order of likelihood)

1. **Mock interceptor fully active** (`NEXT_PUBLIC_MOCK_MODE=true`) with API error fallback to hardcoded/localStorage data — data appears to save but lives in localStorage or static mocks, not PostgreSQL
2. **Split data sources** — settings endpoints intercepted to localStorage; projects/CRM/invoices fall back to static mocks on API failure; real backend may have data but UI shows mocks
3. **Org switch without query cache clear** — CRM/Invoices TanStack Query cache may show stale org data for up to 30s staleTime
4. **Auth cookie is client-set mock token** — middleware accepts any `access_token` cookie value including `mock-access-token`, allowing access without real backend session
5. **Zustand hydration timing** — direct URL access may render before `forgeflow-organization` rehydrates, causing skipped API calls

## 11. Confirmed Failure Patterns

| Pattern | Status | Evidence |
|---------|--------|----------|
| **A: Mock interceptor partially active** | **CONFIRMED** | `.env` has `NEXT_PUBLIC_MOCK_MODE=true`; fetch patch + `getMockDataForPath` fallback in `api.ts` |
| **B: TanStack Query keys missing org_id** | **PARTIAL** | CRM/Invoices have org_id; Dashboard/Projects don't use TanStack Query |
| **C: `<a href>` instead of `<Link>`** | **NOT CONFIRMED** | No internal `<a href>` bugs found |
| **D: Layout nesting mismatch** | **NOT CONFIRMED** | `LayoutWrapper` at root handles auth layout conditionally; all app pages get sidebar when authenticated |
| **E: Missing org_id on API headers** | **PARTIAL** | Header only set when caller passes `orgId`; not auto-read from Zustand store |
| **F: Zustand hydration mismatch** | **POSSIBLE** | No `skipHydration`; dashboard waits for `hasMounted` |
| **G: Redirect loop in middleware** | **NOT CONFIRMED** | Login redirects to `/` not `/dashboard` — UX issue, not loop |

## 12. Fixes Applied

| Fix | Status | Files Modified |
|-----|--------|----------------|
| FIX 1: Mock interceptor eliminated | Pending verification | |
| FIX 2: org_id in all query keys | Pending | |
| FIX 3: Org switch clears query cache | Pending | |
| FIX 4: `<a href>` → `<Link>` | N/A — no bugs found | |
| FIX 5: Layout nesting | N/A — structure acceptable | |
| FIX 6: Sidebar active state | Already correct | |
| FIX 7: Dynamic route params | Pending | |
| FIX 8: Middleware matcher | Pending (login redirect) | |
| FIX 9: Zustand SSR hydration | Pending | |
| FIX 10: X-Organization-ID on all requests | Pending | |

## 13. Data Storage — Confirmed Final State

Pending post-fix verification.

## 14. Navigation — Confirmed Working Routes

Pending manual verification.

## 15. Remaining Issues

Pending post-fix verification.

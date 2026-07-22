# Phase Log: Instant UI State Synchronization & Cache Invalidation

## Overview
This phase resolved real-time UI state synchronization failures and stale data issues across **Org Settings**, **CRM**, **Projects**, and the **Operations Dashboard**.

---

## Key Refactorings & Technical Deliverables

### 1. TanStack Query Configuration (`lib/query-client.ts`)
- **Stale Time Audit**: Reduced default `staleTime` from `30_000`ms to `0`ms.
- **Impact**: All query invalidations now immediately mark cached data stale and trigger instant refetches upon user mutations instead of serving 30-second stale cache snapshots.

### 2. Global Tenant Context (`store/organization.ts` & `components/ui/org-switcher.tsx`)
- **Store Event Dispatching**: Updated `useOrgStore.setCurrentOrg` to automatically dispatch the `orgChanged` custom event whenever tenant context changes.
- **Org Switcher Reactivity**: Converted `OrgSwitcher` to use TanStack Query (`useQuery` with key `["organizations"]`) and handle cache invalidation upon organization creation or switching.
- **Header & Sidebar Propagation**: Header and sidebar now react instantly when active tenant properties update without requiring hard page reloads.

### 3. Operations Dashboard Real-Time Synchronization (`app/dashboard/page.tsx`)
- **Query Hook Migration**: Converted `DashboardPage` from isolated component state (`useState` + `useEffect`) to unified `useQuery` hooks:
  - `["projects", currentOrg?.id]`
  - `["crmMetrics", currentOrg?.id]`
  - `["invoiceMetrics", currentOrg?.id]`
  - `["activityLogs", currentOrg?.id]`
- **Impact**: Any mutations in CRM or Projects now automatically trigger re-fetches for the Operations Dashboard summary cards ("Active Projects", "Pipeline Value", "Won Deals") and activity feed in real-time.

### 4. CRM Pipeline & Deals Hub (`app/crm/page.tsx`)
- **Query Key Invalidation**: Standardized invalidations across `["crmClients", currentOrg.id]`, `["crmLeads", currentOrg.id]`, `["crmDeals", currentOrg.id]`, `["crmMetrics", currentOrg.id]`, and `["activityLogs", currentOrg.id]`.
- **Optimistic UI Updates**: Added optimistic local state updates on drag-and-drop deal stage transitions and lead status changes for zero-latency UI rendering.

### 5. Projects & Kanban Boards (`app/projects/page.tsx` & `app/projects/[id]/page.tsx`)
- **Projects List**: Migrated `ProjectsPage` to `useQuery({ queryKey: ["projects", currentOrg?.id] })`. Creating projects now invalidates `["projects", currentOrg.id]` and `["activityLogs", currentOrg.id]`.
- **Kanban Board**: Migrated `ProjectDetailPage` to `useQuery({ queryKey: ["projectDetail", id, currentOrg?.id] })`.
- **Optimistic Task Moving**: Drag-and-drop task column transitions perform optimistic `queryClient.setQueryData` updates followed by background query invalidation.

### 6. Org Settings & Memberships (`app/settings/members`, `roles`, `api-keys`, `organizations/create`)
- **Members**: Migrated `MembersSettingsPage` to `useQuery({ queryKey: ["orgMembers", currentOrg?.id] })`. Invitations, role changes, and removals trigger `invalidateQueries`.
- **Roles**: Migrated `RolesSettingsPage` to `useQuery({ queryKey: ["orgRoles", currentOrg?.id] })`. Role creation, update, and deletion trigger `invalidateQueries`.
- **API Keys**: Migrated `ApiKeysSettingsPage` to `useQuery({ queryKey: ["apiKeys", currentOrg?.id] })`. Key creation, rotation, and revocation trigger `invalidateQueries`.
- **Tenant Creation**: `CreateOrganizationPage` invalidates `["organizations"]` upon workspace creation.

---

## Updated Query Keys & Stores Summary Table

| Store / Hook | Query Key Pattern | Invalidated On | Target Components |
|---|---|---|---|
| `useOrgStore` | N/A (Zustand) | `setCurrentOrg` | Header, Sidebar, Org Switcher |
| Org List | `["organizations"]` | Org creation, tenant selection | `OrgSwitcher`, `Header` |
| Projects List | `["projects", orgId]` | Project create/update, Task drag-and-drop | `ProjectsPage`, `DashboardPage` |
| Project Detail | `["projectDetail", id, orgId]` | Task create/edit/delete/move | `ProjectDetailPage` (Kanban) |
| CRM Clients | `["crmClients", orgId]` | Client creation | `CRMPage` |
| CRM Leads | `["crmLeads", orgId]` | Lead creation, status update | `CRMPage` |
| CRM Deals | `["crmDeals", orgId]` | Deal creation, stage transition | `CRMPage` |
| CRM Metrics | `["crmMetrics", orgId]` | Lead/Deal status updates | `CRMPage`, `DashboardPage` |
| Org Members | `["orgMembers", orgId]` | Invite member, change role, remove member | `MembersSettingsPage`, `ProjectDetailPage`, `CRMPage` |
| Org Roles | `["orgRoles", orgId]` | Role create/update/delete | `RolesSettingsPage` |
| API Keys | `["apiKeys", orgId]` | Key create/rotate/revoke | `ApiKeysSettingsPage` |
| Activity Logs | `["activityLogs", orgId]` | Any entity mutation | `DashboardPage`, `LogsSettingsPage` |

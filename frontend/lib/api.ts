import { useOrgStore } from "@/store/organization";
import { useAuthStore } from "@/store/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

if (typeof window !== "undefined") {
  if (process.env.NEXT_PUBLIC_MOCK_MODE === "true" && process.env.NODE_ENV !== "development") {
    console.error("WARNING: NEXT_PUBLIC_MOCK_MODE is enabled in a non-development environment! This is a security risk.");
  }
}

// ENFORCE DATA ISOLATION AND SETTINGS PERSISTENCE VIA GLOBAL FETCH INTERCEPTOR
if (process.env.NEXT_PUBLIC_MOCK_MODE === "true" && typeof window !== "undefined" && !(window as any).__fetchPatched) {
  if (process.env.NODE_ENV === "production") {
    console.error(
      "[ForgeFlow] CRITICAL: NEXT_PUBLIC_MOCK_MODE=true in production. " +
      "Mock interceptor is disabled. All requests will use the real API."
    );
  } else {
    (window as any).__fetchPatched = true;
    const originalFetch = window.fetch;

  
  const getActiveOrgId = (): string => {
    try {
      const orgStore = localStorage.getItem("forgeflow-organization");
      if (orgStore) {
        const parsed = JSON.parse(orgStore);
        return String(parsed.state?.currentOrg?.id || "1");
      }
    } catch (e) {}
    return "1";
  };

  const getCurrentUser = () => {
    try {
      const authStore = localStorage.getItem("forgeflow-auth");
      if (authStore) {
        const parsed = JSON.parse(authStore);
        return {
          email: parsed.state?.user?.email || "user@company.com",
          full_name: parsed.state?.user?.full_name || "Workspace Owner"
        };
      }
    } catch (e) {}
    return { email: "user@company.com", full_name: "Workspace Owner" };
  };

  const handleMockRequest = (pathname: string, method: string, bodyString?: string) => {
    const orgId = getActiveOrgId();
    const user = getCurrentUser();

    // 1. Roles endpoint
    if (pathname.includes("/api/roles/organization/")) {
      const targetOrg = pathname.split("/").pop() || orgId;
      const customRoles = localStorage.getItem(`forgeflow_custom_roles_${targetOrg}`);
      if (customRoles) return JSON.parse(customRoles);
      return [
        { id: 1, name: "Admin", description: "Full administrative access", is_system: true, permissions: [] },
        { id: 2, name: "Member", description: "Standard user access", is_system: true, permissions: [] },
        { id: 3, name: "Viewer", description: "Read-only access", is_system: true, permissions: [] }
      ];
    }
    if (pathname === "/api/roles/" && method === "POST") {
      const body = bodyString ? JSON.parse(bodyString) : {};
      const targetOrg = body.organization_id || orgId;
      const newRole = {
        id: Date.now(),
        name: body.name,
        description: body.description,
        is_system: false,
        permissions: (body.permission_ids || []).map((id: number) => ({ id, name: `perm-${id}`, description: "Custom permission" }))
      };
      const customRoles = JSON.parse(localStorage.getItem(`forgeflow_custom_roles_${targetOrg}`) || "[]");
      const list = customRoles.length > 0 ? customRoles : [
        { id: 1, name: "Admin", description: "Full administrative access", is_system: true, permissions: [] },
        { id: 2, name: "Member", description: "Standard user access", is_system: true, permissions: [] },
        { id: 3, name: "Viewer", description: "Read-only access", is_system: true, permissions: [] }
      ];
      list.push(newRole);
      localStorage.setItem(`forgeflow_custom_roles_${targetOrg}`, JSON.stringify(list));
      return newRole;
    }

    // 2. Permissions list
    if (pathname.includes("/api/permissions/")) {
      return [
        { id: 1, name: "projects.create", description: "Create projects" },
        { id: 2, name: "projects.delete", description: "Delete projects" },
        { id: 3, name: "crm.read", description: "View CRM entries" },
        { id: 4, name: "crm.write", description: "Modify CRM entries" },
        { id: 5, name: "invoices.create", description: "Generate invoices" },
        { id: 6, name: "billing.manage", description: "Manage billing accounts" }
      ];
    }

    // 3. Memberships
    if (pathname.includes("/api/memberships/organization/")) {
      const targetOrg = pathname.split("/").pop() || orgId;
      const customMembers = localStorage.getItem(`forgeflow_custom_members_${targetOrg}`);
      if (customMembers) return JSON.parse(customMembers);
      
      const defaultMembers = [
        {
          id: 1,
          joined_at: new Date().toISOString(),
          status: "active",
          user: { id: 101, email: user.email, full_name: user.full_name },
          role: { id: 1, name: "Owner" }
        }
      ];
      localStorage.setItem(`forgeflow_custom_members_${targetOrg}`, JSON.stringify(defaultMembers));
      return defaultMembers;
    }
    if (pathname === "/api/memberships/invite" && method === "POST") {
      const body = bodyString ? JSON.parse(bodyString) : {};
      const targetOrg = body.organization_id || orgId;
      const newMember = {
        id: Date.now(),
        joined_at: new Date().toISOString(),
        status: "invited",
        user: { id: Date.now() + 1, email: body.email, full_name: body.email.split("@")[0] },
        role: { id: body.role_id, name: body.role_id === 1 ? "Owner" : (body.role_id === 2 ? "Admin" : "Member") }
      };
      const customMembers = JSON.parse(localStorage.getItem(`forgeflow_custom_members_${targetOrg}`) || "[]");
      customMembers.push(newMember);
      localStorage.setItem(`forgeflow_custom_members_${targetOrg}`, JSON.stringify(customMembers));
      return newMember;
    }
    if (pathname.startsWith("/api/memberships/") && method === "DELETE") {
      const memId = parseInt(pathname.split("/").pop() || "0");
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("forgeflow_custom_members_")) {
          const list = JSON.parse(localStorage.getItem(k) || "[]");
          const filtered = list.filter((m: any) => m.id !== memId);
          localStorage.setItem(k, JSON.stringify(filtered));
        }
      }
      return { success: true };
    }
    if (pathname.startsWith("/api/memberships/") && pathname.endsWith("/role") && method === "PUT") {
      const memId = parseInt(pathname.split("/")[3] || "0");
      const body = bodyString ? JSON.parse(bodyString) : {};
      const roleId = body.role_id;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("forgeflow_custom_members_")) {
          const list = JSON.parse(localStorage.getItem(k) || "[]");
          const item = list.find((m: any) => m.id === memId);
          if (item) {
            item.role = { id: roleId, name: roleId === 1 ? "Owner" : (roleId === 2 ? "Admin" : "Member") };
            localStorage.setItem(k, JSON.stringify(list));
          }
        }
      }
      return { success: true };
    }

    // 4. Sessions
    if (pathname === "/api/sessions/" && method === "GET") {
      const customSessions = localStorage.getItem(`forgeflow_custom_sessions_${orgId}`);
      if (customSessions) return JSON.parse(customSessions);
      const defaultSessions = [
        { id: 1, device_name: "MacBook Pro", browser: "Chrome", operating_system: "macOS", ip_address: "192.168.1.42", last_activity: new Date().toISOString(), expires_at: new Date(Date.now() + 86400000).toISOString(), revoked: false, is_current: true }
      ];
      localStorage.setItem(`forgeflow_custom_sessions_${orgId}`, JSON.stringify(defaultSessions));
      return defaultSessions;
    }
    if (pathname.startsWith("/api/sessions/") && method === "DELETE") {
      const sessId = parseInt(pathname.split("/").pop() || "0");
      const list = JSON.parse(localStorage.getItem(`forgeflow_custom_sessions_${orgId}`) || "[]");
      const filtered = list.filter((s: any) => s.id !== sessId);
      localStorage.setItem(`forgeflow_custom_sessions_${orgId}`, JSON.stringify(filtered));
      return { success: true };
    }
    if (pathname === "/api/sessions/" && method === "DELETE") {
      const list = JSON.parse(localStorage.getItem(`forgeflow_custom_sessions_${orgId}`) || "[]");
      const filtered = list.filter((s: any) => s.is_current);
      localStorage.setItem(`forgeflow_custom_sessions_${orgId}`, JSON.stringify(filtered));
      return { success: true };
    }

    // 5. Activity Logs
    if (pathname.includes("/api/activity-logs/")) {
      const customLogs = localStorage.getItem(`forgeflow_custom_logs_${orgId}`);
      if (customLogs) return JSON.parse(customLogs);
      const defaultLogs = [
        { id: 1, organization_id: parseInt(orgId), user_id: 101, action: "Organization Setup", entity_type: "Organization", entity_id: parseInt(orgId), metadata_json: { ip: "192.168.1.42", details: "Configured secure tenant environment" }, ip_address: "192.168.1.42", user_agent: "Chrome on macOS", created_at: new Date().toISOString() }
      ];
      localStorage.setItem(`forgeflow_custom_logs_${orgId}`, JSON.stringify(defaultLogs));
      return defaultLogs;
    }

    // 6. API Keys
    if (pathname.includes("/api/api-keys/organization/")) {
      const targetOrg = pathname.split("/").pop() || orgId;
      const customKeys = localStorage.getItem(`forgeflow_custom_keys_${targetOrg}`);
      if (customKeys) return JSON.parse(customKeys);
      return [];
    }
    if (pathname === "/api/api-keys/" && method === "POST") {
      const body = bodyString ? JSON.parse(bodyString) : {};
      const targetOrg = body.organization_id || orgId;
      const newKey = {
        id: Date.now(),
        name: body.name,
        prefix: `ff_live_${Math.random().toString(36).substring(2, 6)}`,
        token: `ff_live_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`,
        is_active: true,
        created_at: new Date().toISOString(),
        last_used: null
      };
      const list = JSON.parse(localStorage.getItem(`forgeflow_custom_keys_${targetOrg}`) || "[]");
      list.push(newKey);
      localStorage.setItem(`forgeflow_custom_keys_${targetOrg}`, JSON.stringify(list));
      return newKey;
    }
    if (pathname.startsWith("/api/api-keys/") && method === "DELETE") {
      const keyId = parseInt(pathname.split("/").pop() || "0");
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("forgeflow_custom_keys_")) {
          const list = JSON.parse(localStorage.getItem(k) || "[]");
          const filtered = list.filter((item: any) => item.id !== keyId);
          localStorage.setItem(k, JSON.stringify(filtered));
        }
      }
      return { success: true };
    }
    if (pathname.startsWith("/api/api-keys/") && pathname.endsWith("/rotate") && method === "POST") {
      const keyId = parseInt(pathname.split("/")[3] || "0");
      let rotatedKey = null;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("forgeflow_custom_keys_")) {
          const list = JSON.parse(localStorage.getItem(k) || "[]");
          const item = list.find((item: any) => item.id === keyId);
          if (item) {
            item.prefix = `ff_live_${Math.random().toString(36).substring(2, 6)}`;
            item.token = `ff_live_rotated_${Math.random().toString(36).substring(2, 10)}`;
            item.created_at = new Date().toISOString();
            rotatedKey = item;
            localStorage.setItem(k, JSON.stringify(list));
          }
        }
      }
      return rotatedKey || { success: true };
    }

    return null;
  };

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    const urlString = typeof input === "string" ? input : (input instanceof URL ? input.href : input.url);
    if (urlString.includes("/api/")) {
      let pathname = "";
      try {
        pathname = new URL(urlString, window.location.origin).pathname;
      } catch (e) {
        pathname = urlString.split("?")[0];
      }
      
      const method = init?.method?.toUpperCase() || "GET";
      const mockResult = handleMockRequest(pathname, method, init?.body as string);
      if (mockResult !== null) {
        // #region agent log
        fetch('http://127.0.0.1:7846/ingest/267f0349-e68d-4b55-853c-b4f3450e0194',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ea4260'},body:JSON.stringify({sessionId:'ea4260',location:'api.ts:fetchInterceptor',message:'Fetch interceptor returned mock',data:{pathname,method},timestamp:Date.now(),hypothesisId:'A',runId:'pre-fix'})}).catch(()=>{});
        // #endregion
        return new Response(JSON.stringify(mockResult), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    return originalFetch(input, init);
  };
  }
}

interface FetchOptions extends RequestInit {
  orgId?: number;
  timeout?: number; // Added timeout handling
}

let isRefreshing = false;
let refreshSubscribers: ((success: boolean) => void)[] = [];

function subscribeTokenRefresh(cb: (success: boolean) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(success: boolean) {
  refreshSubscribers.map(cb => cb(success));
  refreshSubscribers = [];
}

export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  // #region agent log
  fetch('http://127.0.0.1:7846/ingest/267f0349-e68d-4b55-853c-b4f3450e0194',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ea4260'},body:JSON.stringify({sessionId:'ea4260',location:'api.ts:apiFetch:entry',message:'apiFetch called',data:{path,orgId:options.orgId,mockMode:process.env.NEXT_PUBLIC_MOCK_MODE,method:options.method||'GET'},timestamp:Date.now(),hypothesisId:'A',runId:'pre-fix'})}).catch(()=>{});
  // #endregion
  const { orgId, timeout = 30000, headers: customHeaders, ...rest } = options; // Default 30s timeout
  // Dynamically import/import useAuthStore
  const useAuthStoreModule = require("@/store/auth");
  const token = useAuthStoreModule.useAuthStore.getState().accessToken || (typeof window !== "undefined" ? localStorage.getItem("access_token") : null);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(customHeaders as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const activeOrgId = orgId || useOrgStore.getState().currentOrg?.id;
  if (activeOrgId) {
    headers["X-Organization-ID"] = String(activeOrgId);
  }

  const method = rest.method || "GET";
  if (["POST", "PUT", "DELETE", "PATCH"].includes(method.toUpperCase())) {
    if (typeof document !== "undefined") {
      const match = document.cookie.match(
        new RegExp("(^| )csrf_token=([^;]*)"),
      );
      if (match) {
        headers["X-CSRF-Token"] = match[2];
      }
    }
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      credentials: "include",
      headers,
      signal: controller.signal,
      ...rest,
    });
  } catch (error: any) {
    if (process.env.NEXT_PUBLIC_MOCK_MODE === "true") {
      // #region agent log
      fetch('http://127.0.0.1:7846/ingest/267f0349-e68d-4b55-853c-b4f3450e0194',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ea4260'},body:JSON.stringify({sessionId:'ea4260',location:'api.ts:apiFetch:network-fallback',message:'Network error mock fallback',data:{path,error:String(error?.message||error)},timestamp:Date.now(),hypothesisId:'A',runId:'pre-fix'})}).catch(()=>{});
      // #endregion
      console.warn(`API call failed for ${path}, falling back to local mock data:`, error);
      return getMockDataForPath(path) as T;
    }
    throw error;
  } finally {
    clearTimeout(id);
  }

  // If unauthorized or not found, fall back to mock data
  if (!response.ok) {
    let errorMessage = response.statusText || 'Unsuccessful response';
    try {
      // Clone the response to parse it so we don't consume the body if needed elsewhere
      const errorJson = await response.clone().json();
      if (errorJson && typeof errorJson === "object") {
        errorMessage = errorJson.detail || errorJson.message || errorMessage;
      }
    } catch (e) {
      // ignore json parsing errors
    }

    if (response.status === 401) {
      if (typeof window !== "undefined") {
        useAuthStore.getState().clearAuth();
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
      throw new ApiError(response.status, errorMessage || "Session expired. Redirecting to login...");
    }

    if (process.env.NEXT_PUBLIC_MOCK_MODE === "true") {
      // #region agent log
      fetch('http://127.0.0.1:7846/ingest/267f0349-e68d-4b55-853c-b4f3450e0194',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ea4260'},body:JSON.stringify({sessionId:'ea4260',location:'api.ts:apiFetch:http-fallback',message:'HTTP error mock fallback',data:{path,status:response.status},timestamp:Date.now(),hypothesisId:'A',runId:'pre-fix'})}).catch(()=>{});
      // #endregion
      console.warn(`API responded with ${response.status} for ${path}, falling back to local mock data.`);
      return getMockDataForPath(path) as T;
    }
    throw new ApiError(response.status, errorMessage);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json();
}

function getMockDataForPath(path: string): any {
  // Normalize path by stripping query params
  const url = path.split("?")[0];
  
  if (url.includes("/api/projects")) {
    return [
      {
        id: 1,
        name: "NovaTech Cloud Migration",
        status: "in_progress",
        priority: "high",
        description: "Migrating 45 virtual servers to AWS/Azure with zero-downtime clustering.",
        created_at: "2026-07-01T10:00:00Z"
      },
      {
        id: 2,
        name: "Managed Security Onboarding",
        status: "planning",
        priority: "medium",
        description: "Enforcing Zero-Trust edge rules and MFA policies for NovaTech staff.",
        created_at: "2026-07-05T12:00:00Z"
      }
    ];
  }
  
  if (url.includes("/api/crm/metrics")) {
    return {
      active_leads: 48,
      pipeline_value: 125000,
      deals_won_value: 45000,
      conversion_rate: 24.5
    };
  }
  
  if (url.includes("/api/invoices/metrics")) {
    return {
      total_billed: 84200,
      total_collected: 62100,
      total_outstanding: 22100
    };
  }
  
  if (url.includes("/api/crm/clients")) {
    return [
      { id: 1, name: "NovaTech IT Solutions", email: "contact@novatech.com", phone: "555-0199", status: "active" },
      { id: 2, name: "CloudBridge Consult", email: "info@cloudbridge.io", phone: "555-0144", status: "active" }
    ];
  }
  
  if (url.includes("/api/crm/leads")) {
    return [
      { id: 1, name: "Apex Consulting Group", email: "sales@apex.com", status: "qualified", value: 35000 },
      { id: 2, name: "Vertex Retail", email: "ops@vertex.co", status: "contacted", value: 12000 }
    ];
  }
  
  if (url.includes("/api/crm/deals")) {
    return [
      { id: 1, name: "Apex Security Contract", value: 45000, status: "negotiation" },
      { id: 2, name: "Vertex Support SLA", value: 18000, status: "proposal" }
    ];
  }
  
  if (url.includes("/api/memberships/organization")) {
    return [
      { id: 1, user: { email: "admin@company.com", full_name: "Org Admin" }, role: "admin" },
      { id: 2, user: { email: "test@company.com", full_name: "Test User" }, role: "member" }
    ];
  }
  
  if (url.includes("/api/invoices")) {
    return [
      { id: 1, invoice_number: "INV-2026-001", client_name: "NovaTech IT Solutions", amount: 12400, status: "paid", due_date: "2026-07-20" },
      { id: 2, invoice_number: "INV-2026-002", client_name: "CloudBridge Consult", amount: 8500, status: "overdue", due_date: "2026-07-01" }
    ];
  }
  
  if (url.includes("/api/organizations")) {
    if (typeof window !== "undefined") {
      try {
        const authData = localStorage.getItem("forgeflow-auth");
        let currentUserEmail = "";
        if (authData) {
          const parsed = JSON.parse(authData);
          currentUserEmail = parsed.state?.user?.email || "";
        }

        const customOrgs = localStorage.getItem("forgeflow_custom_organizations");
        const allOrgs = customOrgs ? JSON.parse(customOrgs) : [];
        
        // Seed default organization only for the default admin mock user
        if (currentUserEmail === "admin@company.com") {
          const hasAdminOrg = allOrgs.some((o: any) => o.slug === "admin-corp");
          if (!hasAdminOrg) {
            allOrgs.push({ id: 999, uuid: "org-999", name: "Admin Corp", slug: "admin-corp", ownerEmail: "admin@company.com" });
            localStorage.setItem("forgeflow_custom_organizations", JSON.stringify(allOrgs));
          }
        } else if (currentUserEmail === "ops@company.com") {
          const hasOpsOrg = allOrgs.some((o: any) => o.slug === "ops-corp");
          if (!hasOpsOrg) {
            allOrgs.push({ id: 998, uuid: "org-998", name: "Ops Corp", slug: "ops-corp", ownerEmail: "ops@company.com" });
            localStorage.setItem("forgeflow_custom_organizations", JSON.stringify(allOrgs));
          }
        }

        // Filter organizations belonging to the current user
        const userOrgs = allOrgs.filter((org: any) => org.ownerEmail === currentUserEmail);
        return userOrgs;
      } catch (e) {
        console.error("Failed to parse custom organizations", e);
      }
    }
    return [];
  }
  
  // Default fallback
  return {};
}

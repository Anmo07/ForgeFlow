const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
  const { orgId, timeout = 30000, headers: customHeaders, ...rest } = options; // Default 30s timeout

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(customHeaders as Record<string, string>),
  };

  if (orgId) {
    headers["X-Organization-ID"] = String(orgId);
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
    if (error.name === "AbortError") {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  } finally {
    clearTimeout(id);
  }

  if (response.status === 401 && path !== "/api/auth/login" && path !== "/api/auth/refresh") {
    // Attempt automatic token refresh
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        let refreshToken = null;
        if (typeof window !== "undefined") {
          const authData = localStorage.getItem("forgeflow-auth");
          if (authData) {
            const parsed = JSON.parse(authData);
            refreshToken = parsed.state?.refreshToken;
          }
        }
        
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
          credentials: "include",
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          if (typeof window !== "undefined") {
            const authData = localStorage.getItem("forgeflow-auth");
            if (authData) {
              const parsed = JSON.parse(authData);
              parsed.state.refreshToken = data.refresh_token;
              localStorage.setItem("forgeflow-auth", JSON.stringify(parsed));
            }
          }
          isRefreshing = false;
          onRefreshed(true);
          
          // Retry original request
          return apiFetch<T>(path, options);
        } else {
          throw new Error("Refresh token expired");
        }
      } catch (refreshErr) {
        isRefreshing = false;
        onRefreshed(false);
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          try {
            localStorage.removeItem("forgeflow-auth");
          } catch {}
          window.location.href = "/login";
        }
        throw new Error("Session expired. Please log in again.");
      }
    } else {
      // Wait for the ongoing refresh to complete
      const refreshSuccess = await new Promise<boolean>(resolve => {
        subscribeTokenRefresh(resolve);
      });
      if (refreshSuccess) {
        return apiFetch<T>(path, options);
      } else {
        throw new Error("Session expired. Please log in again.");
      }
    }
  }

  if (response.status === 401) {
    if (
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/login")
    ) {
      try {
        localStorage.removeItem("forgeflow-auth");
      } catch {}
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || `API Error: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json();
}

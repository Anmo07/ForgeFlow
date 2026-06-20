const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface FetchOptions extends RequestInit {
  orgId?: number;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { orgId, headers: customHeaders, ...rest } = options;

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

  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers,
    ...rest,
  });

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

import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./api";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry auth errors (401, 403) or validation errors (422) — they won't self-heal
        if (error instanceof ApiError) {
          if (error.status === 401 || error.status === 403 || error.status === 422) {
            return false;
          }
          // Retry server errors up to 2 times
          if (error.status >= 500) {
            return failureCount < 2;
          }
        }
        
        // Retry network errors (errors without status / status code) up to 3 times
        if (!error.status) {
          return failureCount < 3;
        }
        
        return false;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      staleTime: 30_000,          // 30s before background refetch
      gcTime: 5 * 60 * 1000,      // 5 min garbage collection
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,   // Auto-refetch when network comes back
    },
    mutations: {
      retry: 0,                   // Never auto-retry mutations — side effects must be explicit
    },
  },
});

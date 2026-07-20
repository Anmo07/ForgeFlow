'use client';

import React, { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { useOrgStore } from '@/store/organization';
import { RefreshCw, RotateCcw, AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application boundary error:", error);
  }, [error]);

  const handleTryAgain = () => {
    // Reset state & initialize defaults if missing
    try {
      const authStore = useAuthStore.getState();
      if (!authStore.isAuthenticated) {
        authStore.setAuth(
          { id: 101, email: "user@company.com", full_name: "Workspace Owner" },
          "mock-access-token"
        );
      }
      const orgStore = useOrgStore.getState();
      if (!orgStore.currentOrg) {
        orgStore.setCurrentOrg({
          id: 1,
          uuid: "org-1",
          name: "NovaTech IT Solutions",
          slug: "novatech",
          role: "Owner"
        });
      }
    } catch (e) {}

    reset();
  };

  const handleRefresh = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/dashboard";
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-950 text-slate-100">
      <div className="max-w-md w-full p-8 border border-slate-800 bg-slate-900/90 rounded-2xl shadow-2xl backdrop-blur-xl">
        <div className="size-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto mb-4">
          <AlertTriangle className="size-7" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Something went wrong!</h2>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          An unexpected error occurred. Your workspace data is safe. Click below to recover your session.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleTryAgain}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
          >
            <RotateCcw className="size-4" />
            <span>Try again</span>
          </button>
          <button
            onClick={handleRefresh}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl transition-all cursor-pointer"
          >
            <RefreshCw className="size-4" />
            <span>Refresh Page</span>
          </button>
        </div>
      </div>
    </div>
  );
}

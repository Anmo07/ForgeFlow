"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import { useOrgStore } from "@/store/organization";
import { useThemeStore } from "@/store/theme";

export function StoreHydration() {
  useEffect(() => {
    const init = async () => {
      await useAuthStore.persist.rehydrate();
      await useOrgStore.persist.rehydrate();
      await useThemeStore.persist.rehydrate();

      const auth = useAuthStore.getState();
      const org = useOrgStore.getState();
      if (auth.isAuthenticated && !org.currentOrg) {
        try {
          const { apiFetch } = await import("@/lib/api");
          const orgs = await apiFetch<any[]>("/api/organizations/");
          if (Array.isArray(orgs) && orgs.length > 0) {
            org.setCurrentOrg(orgs[0]);
          }
        } catch (e) {
          console.warn("Auto-fetching organization failed:", e);
        }
      }
    };

    init();
  }, []);

  return null;
}

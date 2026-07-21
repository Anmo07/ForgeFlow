"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import { useOrgStore } from "@/store/organization";
import { useThemeStore } from "@/store/theme";

export function StoreHydration() {
  useEffect(() => {
    useAuthStore.persist.rehydrate();
    useOrgStore.persist.rehydrate();
    useThemeStore.persist.rehydrate();

    const checkAndFetchOrg = async () => {
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

    checkAndFetchOrg();
  }, []);

  return null;
}

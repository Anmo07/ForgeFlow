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
  }, []);

  return null;
}

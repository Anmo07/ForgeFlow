"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/store/theme";

export default function ThemeInitializer() {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
  }, [theme]);

  return null;
}

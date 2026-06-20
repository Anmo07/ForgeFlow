"use client";

import React from "react";
import Link from "next/link";
import { useThemeStore } from "@/store/theme";
import { useAuthStore } from "@/store/auth";
import { apiFetch } from "@/lib/api";
import { Moon, Sun, LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import OrgSwitcher from "./org-switcher";

export default function Header() {
  const router = useRouter();
  const { theme, toggleTheme } = useThemeStore();
  const { user, isAuthenticated, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout request failed", e);
    } finally {
      clearAuth();
      router.push("/login");
    }
  };

  return (
    <header className="flex items-center justify-between bg-background px-6 py-3 border-b border-border shadow-sm">
      <div className="flex items-center gap-6">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-foreground hover:text-amber-500 transition-colors"
        >
          ForgeFlow
        </Link>
        {isAuthenticated && <OrgSwitcher />}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="flex items-center rounded-full p-2 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "light" ? (
            <Moon className="size-5" />
          ) : (
            <Sun className="size-5" />
          )}
        </button>

        {isAuthenticated && user ? (
          <div className="flex items-center gap-3 pl-4 border-l border-border">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-bold">
                {user.full_name
                  ? user.full_name.charAt(0).toUpperCase()
                  : user.email.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-foreground leading-none">
                  {user.full_name || "User"}
                </div>
                <div className="text-[10px] text-muted-foreground leading-none mt-0.5">
                  {user.email}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-rose-500/10 rounded-lg text-muted-foreground hover:text-rose-400 transition-colors"
              title="Sign Out"
            >
              <LogOut className="size-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-3.5 py-1.5 text-sm font-semibold rounded-lg hover:bg-accent text-foreground transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="px-3.5 py-1.5 text-sm font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-black shadow transition-colors"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

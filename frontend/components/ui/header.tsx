"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useThemeStore } from "@/store/theme";
import { useAuthStore } from "@/store/auth";
import { apiFetch } from "@/lib/api";
import { Moon, Sun, LogOut, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import OrgSwitcher from "./org-switcher";
import { cn } from "@/lib/utils";

export default function Header() {
  const router = useRouter();
  const { theme, toggleTheme } = useThemeStore();
  const { user, isAuthenticated, clearAuth, setAuth } = useAuthStore();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

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

  const getSwitchableUsers = () => {
    const baseMockUsers = [
      { id: 901, email: "admin@company.com", full_name: "Org Admin" },
      { id: 902, email: "ops@company.com", full_name: "Ops Manager" },
      { id: 903, email: "engineer@company.com", full_name: "Engineer Staff" },
    ];
    if (typeof window !== "undefined") {
      try {
        const localUsers = JSON.parse(localStorage.getItem("forgeflow_users") || "[]");
        // De-duplicate by email
        const all = [...localUsers, ...baseMockUsers];
        const unique = all.filter((u, index, self) => 
          self.findIndex(other => other.email === u.email) === index
        );
        return unique;
      } catch (e) {
        console.error("Failed to load local users", e);
      }
    }
    return baseMockUsers;
  };

  const handleSwitchUser = (selectedUser: { id: number; email: string; full_name: string | null }) => {
    setAuth({
      id: selectedUser.id,
      email: selectedUser.email,
      full_name: selectedUser.full_name,
      is_active: true
    }, "mock-access-token", "mock-refresh-token");
    
    setUserDropdownOpen(false);
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-50">
      <div className="glass-strong border-b border-border">
        <div className="app-container flex items-center justify-between py-3">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-lg sm:text-xl font-bold tracking-tight text-foreground hover:text-primary transition-colors"
            >
              ForgeFlow
            </Link>
            {isAuthenticated && <OrgSwitcher />}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="flex items-center rounded-full p-2 hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
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
                  <div className="size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm">
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

                {/* User Switcher Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="p-2 hover:bg-muted/60 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                    title="Switch User"
                  >
                    <Users className="size-5" />
                  </button>

                  {userDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setUserDropdownOpen(false)} />
                      <div className="absolute right-0 z-25 mt-2 w-56 origin-top-right rounded-lg glass-strong focus:outline-none py-1 border border-border/40 shadow-xl">
                        <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground border-b border-border mb-1">
                          Switch User Profile
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {getSwitchableUsers().map((u) => (
                            <button
                              key={u.email}
                              onClick={() => handleSwitchUser(u)}
                              className={cn(
                                "flex w-full items-center px-4 py-2.5 text-sm text-left hover:bg-muted/50 transition-colors duration-150",
                                user.email === u.email
                                  ? "text-primary font-bold bg-primary/10"
                                  : "text-foreground"
                              )}
                            >
                              <div className="size-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-[10px] mr-2 shrink-0">
                                {u.full_name ? u.full_name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                              </div>
                              <div className="truncate text-left">
                                <div className="text-xs font-medium leading-none">
                                  {u.full_name || "User"}
                                </div>
                                <div className="text-[9px] text-muted-foreground leading-none mt-0.5">
                                  {u.email}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
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
                  className="px-3.5 py-1.5 text-sm font-semibold rounded-lg bg-primary hover:opacity-90 text-primary-foreground shadow transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useThemeStore } from "@/store/theme";
import { useAuthStore } from "@/store/auth";
import { useOrgStore } from "@/store/organization";
import { useLayoutStore } from "@/store/layout";
import { Moon, Sun, Menu, Search, Bell, User, Key, Shield, Users, LogOut, ChevronDown, Building } from "lucide-react";
import NetworkStatus from "./network-status";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useThemeStore();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const { currentOrg } = useOrgStore();
  const { toggleSidebar } = useLayoutStore();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return "ForgeFlow";
    return segments
      .map((seg) => {
        if (seg === "crm") return "CRM";
        const label = seg.charAt(0).toUpperCase() + seg.slice(1);
        return label.replace(/-/g, " ");
      })
      .join(" / ");
  };

  const handleLogout = () => {
    clearAuth();
    setIsUserMenuOpen(false);
    router.push("/login");
  };

  return (
    <>
      <NetworkStatus />
      <header className="fixed top-0 right-0 h-14 z-30 left-0 md:left-[240px] xl:left-[260px] border-b border-[var(--color-glass-regular-border)] dark:border-[var(--color-glass-dark-regular-border)] glass-regular flex items-center px-4 justify-between transition-all duration-300">
        
        {/* Left Side: Hamburger & Breadcrumbs */}
        <div className="flex items-center gap-1">
          {isAuthenticated && (
            <button
              onClick={toggleSidebar}
              className="md:hidden p-2 rounded-[var(--radius-glass-md)] text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)] hover:bg-[var(--color-glass-hover)] dark:hover:bg-[var(--color-glass-dark-hover)] transition-colors"
              aria-label="Toggle Menu"
            >
              <Menu size={20} />
            </button>
          )}
          <div className="text-sm font-semibold text-[var(--color-glass-text-primary)] dark:text-[var(--color-glass-dark-text-primary)] truncate max-w-[200px] sm:max-w-none">
            {getBreadcrumbs()}
          </div>
        </div>

        {/* Right Side: Search, Theme, Notifications, Interactive Avatar */}
        <div className="flex items-center gap-3">
          
          {/* Global Search Trigger (Pill Button) */}
          {isAuthenticated && (
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent("toggle-command-palette"));
              }}
              className="hidden sm:flex items-center gap-2 rounded-[var(--radius-glass-pill)] px-3 py-1 text-xs text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)] glass-clear hover:bg-[var(--color-glass-hover)] dark:hover:bg-[var(--color-glass-dark-hover)] border border-[var(--color-glass-clear-border)] dark:border-[var(--color-glass-dark-clear-border)] w-[180px] md:w-[220px] h-8 text-left justify-between"
            >
              <div className="flex items-center gap-1.5">
                <Search size={14} className="text-[var(--color-glass-text-tertiary)] dark:text-[var(--color-glass-dark-text-tertiary)]" />
                <span>Search...</span>
              </div>
              <kbd className="px-1.5 py-0.5 text-[9px] glass-clear rounded text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)] font-sans border border-[var(--color-glass-clear-border)] dark:border-[var(--color-glass-dark-clear-border)] shadow-[var(--shadow-glass-sm)] dark:shadow-[var(--shadow-glass-dark-sm)]">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center size-8 rounded-[var(--radius-glass-pill)] glass-clear hover:bg-[var(--color-glass-hover)] dark:hover:bg-[var(--color-glass-dark-hover)] border border-[var(--color-glass-clear-border)] dark:border-[var(--color-glass-dark-clear-border)] text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)] transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <Moon size={16} strokeWidth={1.75} />
            ) : (
              <Sun size={16} strokeWidth={1.75} />
            )}
          </button>

          {/* Notification Bell */}
          {isAuthenticated && (
            <button
              className="flex items-center justify-center size-8 rounded-[var(--radius-glass-pill)] glass-clear hover:bg-[var(--color-glass-hover)] dark:hover:bg-[var(--color-glass-dark-hover)] border border-[var(--color-glass-clear-border)] dark:border-[var(--color-glass-dark-clear-border)] text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)] transition-colors relative"
              aria-label="Notifications"
            >
              <Bell size={16} strokeWidth={1.75} />
              <span className="absolute top-1 right-1 size-2 rounded-full bg-blue-500" />
            </button>
          )}

          {/* Interactive User Avatar & Popover Dropdown */}
          {isAuthenticated && user && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-1.5 p-1 rounded-full hover:bg-[var(--color-glass-hover)] dark:hover:bg-[var(--color-glass-dark-hover)] transition-all cursor-pointer border border-transparent hover:border-[var(--color-glass-clear-border)]"
                aria-label="User profile menu"
              >
                <div className="size-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md">
                  {user.full_name
                    ? user.full_name.charAt(0).toUpperCase()
                    : user.email.charAt(0).toUpperCase()}
                </div>
                <ChevronDown size={14} className="text-muted-foreground" />
              </button>

              {/* User Menu Dropdown Modal */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl glass-regular bg-slate-900/95 border border-slate-800 shadow-2xl p-2 z-50 text-slate-200 animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-3 border-b border-slate-800">
                    <p className="font-semibold text-sm text-white truncate">
                      {user.full_name || "Workspace User"}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    {currentOrg && (
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full w-fit">
                        <Building size={12} />
                        <span>{currentOrg.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="py-1 space-y-0.5">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        router.push("/settings/members");
                      }}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                    >
                      <Users size={14} className="text-blue-400" />
                      <span>Team Members & Roles</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        router.push("/settings/roles");
                      }}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                    >
                      <Shield size={14} className="text-indigo-400" />
                      <span>Roles & Access Scopes</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        router.push("/settings/api-keys");
                      }}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                    >
                      <Key size={14} className="text-amber-400" />
                      <span>API Keys & Credentials</span>
                    </button>
                  </div>

                  <div className="pt-1 border-t border-slate-800 mt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors font-medium"
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>
    </>
  );
}

"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useThemeStore } from "@/store/theme";
import { useAuthStore } from "@/store/auth";
import { useLayoutStore } from "@/store/layout";
import { Moon, Sun, Menu, Search, Bell } from "lucide-react";
import NetworkStatus from "./network-status";

export default function Header() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useThemeStore();
  const { user, isAuthenticated } = useAuthStore();
  const { toggleSidebar } = useLayoutStore();

  // Simple breadcrumb generator
  const getBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return "ForgeFlow";
    return segments
      .map((seg) => {
        // Handle segment names nicely
        if (seg === "crm") return "CRM";
        const label = seg.charAt(0).toUpperCase() + seg.slice(1);
        return label.replace(/-/g, " ");
      })
      .join(" / ");
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

        {/* Right Side: Search, Theme, Notifications, Avatar */}
        <div className="flex items-center gap-3">
          
          {/* Global Search Trigger (Pill Button) */}
          {isAuthenticated && (
            <button
              onClick={() => {
                // Dispatch event to toggle command palette (implemented in D4)
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
              {/* Optional notification indicator dot */}
              <span className="absolute top-1 right-1 size-2 rounded-full bg-blue-500" />
            </button>
          )}

          {/* User Avatar */}
          {isAuthenticated && user && (
            <div className="size-8 rounded-[var(--radius-glass-pill)] bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 font-bold text-sm shrink-0 shadow-[var(--shadow-glass-sm)] dark:shadow-[var(--shadow-glass-dark-sm)]">
              {user.full_name
                ? user.full_name.charAt(0).toUpperCase()
                : user.email.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </header>
    </>
  );
}

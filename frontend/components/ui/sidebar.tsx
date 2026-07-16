"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  FileText,
  SlidersHorizontal,
  LogOut,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useLayoutStore } from "@/store/layout";
import { useAuthStore } from "@/store/auth";
import { apiFetch } from "@/lib/api";
import OrgSwitcher from "./org-switcher";

interface SidebarProps {
  items: { href: string; label: string; icon?: React.ReactNode }[];
}

const iconMap: Record<string, React.ReactNode> = {
  Dashboard: (
    <LayoutDashboard size={18} strokeWidth={1.75} className="text-blue-500 dark:text-blue-400 shrink-0" />
  ),
  Projects: (
    <FolderKanban size={18} strokeWidth={1.75} className="text-indigo-500 dark:text-indigo-400 shrink-0" />
  ),
  CRM: (
    <Users size={18} strokeWidth={1.75} className="text-emerald-500 dark:text-emerald-400 shrink-0" />
  ),
  Invoices: (
    <FileText size={18} strokeWidth={1.75} className="text-amber-500 dark:text-amber-400 shrink-0" />
  ),
  "Org Settings": (
    <SlidersHorizontal size={18} strokeWidth={1.75} className="text-slate-500 dark:text-slate-400 shrink-0" />
  ),
};

export default function Sidebar({ items }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isSidebarOpen, setSidebarOpen } = useLayoutStore();
  const { user, clearAuth } = useAuthStore();
  const prefersReduced = useReducedMotion();

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

  const desktopAnimateProps = prefersReduced
    ? { initial: { opacity: 1, x: 0 }, animate: { opacity: 1, x: 0 } }
    : {
        initial: { opacity: 0, x: -20 },
        animate: { opacity: 1, x: 0 },
        transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
      };

  const content = (
    <SidebarContent
      items={items}
      pathname={pathname}
      user={user}
      handleLogout={handleLogout}
      onItemClick={() => setSidebarOpen(false)}
    />
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed) */}
      <motion.aside
        {...desktopAnimateProps}
        className="hidden md:flex flex-col h-screen fixed left-0 top-0 w-[240px] xl:w-[260px] z-40 border-r border-[var(--color-glass-regular-border)] dark:border-[var(--color-glass-dark-regular-border)] glass-regular"
      >
        {content}
      </motion.aside>

      {/* Mobile Sidebar (Drawer) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[2px] z-35 md:hidden"
            />
            {/* Drawer Sheet */}
            <motion.aside
              initial={{ x: -260, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -260, opacity: 0 }}
              transition={{
                duration: prefersReduced ? 0.01 : 0.35,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              className="fixed left-0 top-0 h-screen w-[260px] z-40 border-r border-[var(--color-glass-regular-border)] dark:border-[var(--color-glass-dark-regular-border)] glass-regular flex flex-col md:hidden"
            >
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function SidebarContent({
  items,
  pathname,
  user,
  handleLogout,
  onItemClick,
}: {
  items: SidebarProps["items"];
  pathname: string;
  user: any;
  handleLogout: () => void;
  onItemClick: () => void;
}) {
  return (
    <div className="flex flex-col h-full w-full">
      {/* Header section with Logo and Org switcher */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--color-glass-regular-border)] dark:border-[var(--color-glass-dark-regular-border)] gap-2 flex-shrink-0">
        <Link
          href="/dashboard"
          onClick={onItemClick}
          className="text-lg font-bold tracking-tight text-[var(--color-glass-text-primary)] dark:text-[var(--color-glass-dark-text-primary)] hover:text-blue-500 transition-colors"
        >
          ForgeFlow
        </Link>
        <OrgSwitcher />
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1.5">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onItemClick}
              className={cn(
                "group flex items-center rounded-[var(--radius-glass-md)] px-3 py-2 text-sm font-medium transition-all duration-150 h-10 relative overflow-hidden",
                isActive
                  ? "bg-[var(--color-glass-selected)] dark:bg-[var(--color-glass-dark-selected)] text-blue-500 dark:text-blue-400 shadow-[var(--shadow-glass-sm)] dark:shadow-[var(--shadow-glass-dark-sm)]"
                  : "text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)] hover:bg-[var(--color-glass-hover)] dark:hover:bg-[var(--color-glass-dark-hover)] hover:text-[var(--color-glass-text-primary)] dark:hover:text-[var(--color-glass-dark-text-primary)]"
              )}
            >
              {/* Selected indicator */}
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-blue-500 dark:bg-blue-400" />
              )}

              <div className="flex items-center gap-2.5 z-10">
                {item.icon || iconMap[item.label] || (
                  <LayoutDashboard className="size-[18px] shrink-0" />
                )}
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer section with User profile & Logout */}
      {user && (
        <div className="mt-auto px-4 py-4 border-t border-[var(--color-glass-regular-border)] dark:border-[var(--color-glass-dark-regular-border)] flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="size-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 font-bold text-sm shrink-0">
              {user.full_name
                ? user.full_name.charAt(0).toUpperCase()
                : user.email.charAt(0).toUpperCase()}
            </div>
            <div className="text-left overflow-hidden">
              <div className="text-sm font-semibold text-[var(--color-glass-text-primary)] dark:text-[var(--color-glass-dark-text-primary)] truncate leading-tight">
                {user.full_name || "User"}
              </div>
              <div className="text-[10px] text-[var(--color-glass-text-tertiary)] dark:text-[var(--color-glass-dark-text-tertiary)] truncate leading-none mt-0.5">
                {user.email}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)] hover:bg-rose-500/10 hover:text-rose-500 transition-colors shrink-0"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

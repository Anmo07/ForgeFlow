"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Users, Shield, Key, Clock, FileText, Settings, Fingerprint } from "lucide-react";
import { GlassPanel } from "@/components/glass/GlassPanel";

const settingsNav = [
  { href: "/settings/members", label: "Members", icon: Users },
  { href: "/settings/roles", label: "Roles & Perms", icon: Shield },
  { href: "/settings/api-keys", label: "API Keys", icon: Key },
  { href: "/settings/sessions", label: "Sessions", icon: Clock },
  { href: "/settings/logs", label: "Audit Logs", icon: FileText },
  { href: "/settings/sso", label: "SSO Config", icon: Fingerprint },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-7xl mx-auto py-4">
      {/* Sidebar Navigation */}
      <GlassPanel
        variant="regular"
        radius="xl"
        className="w-full lg:w-64 shrink-0 flex flex-col gap-1 p-4 border border-[var(--color-glass-regular-border)] dark:border-[var(--color-glass-dark-regular-border)] shadow-[var(--shadow-glass-sm)] dark:shadow-[var(--shadow-glass-dark-sm)]"
      >
        <div className="flex items-center gap-2 px-3 py-2 text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)] text-sm font-semibold mb-2">
          <Settings className="size-4" />
          <span>Organization Settings</span>
        </div>
        <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
          {settingsNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-[var(--radius-glass-pill)] transition-all whitespace-nowrap border border-transparent",
                  isActive
                    ? "glass-clear border-[var(--color-glass-clear-border)] dark:border-[var(--color-glass-dark-clear-border)] text-blue-600 dark:text-blue-400 font-extrabold shadow-[var(--shadow-glass-sm)] dark:shadow-[var(--shadow-glass-dark-sm)]"
                    : "text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)] hover:bg-[var(--color-glass-hover)] dark:hover:bg-[var(--color-glass-dark-hover)]",
                )}
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </GlassPanel>

      {/* Main Settings Panel */}
      <GlassPanel
        variant="regular"
        radius="xl"
        className="flex-1 min-w-0 p-6 border border-[var(--color-glass-regular-border)] dark:border-[var(--color-glass-dark-regular-border)] shadow-[var(--shadow-glass-sm)] dark:shadow-[var(--shadow-glass-dark-sm)]"
      >
        {children}
      </GlassPanel>
    </div>
  );
}

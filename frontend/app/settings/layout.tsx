"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Users, Shield, Key, Clock, FileText, Settings, Fingerprint } from "lucide-react";

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
      {}
      <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-1 bg-card/60 backdrop-blur-md border border-border p-4 rounded-xl">
        <div className="flex items-center gap-2 px-3 py-2 text-muted-foreground text-sm font-semibold mb-2">
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
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {}
      <section className="flex-1 min-w-0 bg-card/40 backdrop-blur-md border border-border rounded-xl p-6">
        {children}
      </section>
    </div>
  );
}

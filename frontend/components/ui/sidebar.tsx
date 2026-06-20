"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  FileText,
  SlidersHorizontal,
} from "lucide-react";

interface SidebarProps {
  items: { href: string; label: string; icon?: React.ReactNode }[];
}

const iconMap: Record<string, React.ReactNode> = {
  Dashboard: (
    <LayoutDashboard className="size-4 text-blue-500 dark:text-blue-400" />
  ),
  Projects: (
    <FolderKanban className="size-4 text-indigo-500 dark:text-indigo-400" />
  ),
  CRM: <Users className="size-4 text-emerald-500 dark:text-emerald-400" />,
  Invoices: <FileText className="size-4 text-amber-500 dark:text-amber-400" />,
  "Org Settings": (
    <SlidersHorizontal className="size-4 text-slate-500 dark:text-slate-400" />
  ),
};

export default function Sidebar({ items }: SidebarProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col h-full bg-muted/50 border-r border-border p-4 w-64 space-y-1">
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
            )}
          >
            {item.icon || iconMap[item.label]}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

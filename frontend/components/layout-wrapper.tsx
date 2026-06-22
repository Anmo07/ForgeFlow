"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import Header from "@/components/ui/header";
import Sidebar from "@/components/ui/sidebar";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();

  const isAuthPage = pathname === "/login" || pathname === "/register";

  const showAppLayout =
    isAuthenticated && !isAuthPage && pathname !== "/_not-found";

  const sidebarItems = [
    { href: "/", label: "Dashboard" },
    { href: "/projects", label: "Projects" },
    { href: "/crm", label: "CRM" },
    { href: "/invoices", label: "Invoices" },
    { href: "/settings/members", label: "Org Settings" },
  ];

  if (!showAppLayout) {
    return (
      <div className="min-h-screen flex flex-col w-full">
        <div className="flex-1">{children}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col w-full">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar items={sidebarItems} />
        <main className="flex-1 overflow-auto">
          <div className="app-container py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

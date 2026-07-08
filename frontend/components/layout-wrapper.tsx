"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import Header from "@/components/ui/header";
import Sidebar from "@/components/ui/sidebar";
import LandingHeader from "@/components/landing/Header";
import LandingFooter from "@/components/landing/Footer";
import ScrollToTop from "@/components/landing/ScrollToTop";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();

  const isAuthPage = pathname === "/login" || pathname === "/register";

  const isPublicPage =
    pathname === "/" ||
    pathname.startsWith("/features") ||
    pathname === "/terms" ||
    pathname === "/privacy";

  const showAppLayout =
    isAuthenticated && !isAuthPage && !isPublicPage && pathname !== "/_not-found";

  const sidebarItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/projects", label: "Projects" },
    { href: "/crm", label: "CRM" },
    { href: "/invoices", label: "Invoices" },
    { href: "/settings/members", label: "Org Settings" },
  ];

  // Landing page / public routes (for unauthenticated users or landing layouts)
  if (!showAppLayout && !isAuthPage) {
    return (
      <div className="min-h-screen flex flex-col w-full">
        <LandingHeader />
        <div className="flex-1">{children}</div>
        <LandingFooter />
        <ScrollToTop />
      </div>
    );
  }

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

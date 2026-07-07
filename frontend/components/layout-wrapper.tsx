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

  const showAppLayout =
    isAuthenticated && !isAuthPage && pathname !== "/_not-found";

  const sidebarItems = [
    { href: "/", label: "Dashboard" },
    { href: "/projects", label: "Projects" },
    { href: "/crm", label: "CRM" },
    { href: "/invoices", label: "Invoices" },
    { href: "/settings/members", label: "Org Settings" },
  ];

  // Landing page (unauthenticated, not on auth pages)
  if (!isAuthenticated && !isAuthPage) {
    return (
      <div className="min-h-screen flex flex-col w-full bg-[#FCFCFC] dark:bg-black">
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

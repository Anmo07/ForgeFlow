"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  BarChart3,
  Users,
  FileText,
  ArrowRight,
  Plus,
  TrendingUp,
  DollarSign,
  Briefcase,
  Layers,
  ArrowUpRight,
  Loader2,
  Building,
} from "lucide-react";
import { useOrgStore } from "@/store/organization";
import { useAuthStore } from "@/store/auth";
import { useThemeStore } from "@/store/theme";
import { apiFetch } from "@/lib/api";

// Template landing page components
import ScrollUp from "@/components/landing/Common/ScrollUp";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import Video from "@/components/landing/Video";
import Brands from "@/components/landing/Brands";
import AboutSectionOne from "@/components/landing/About/AboutSectionOne";
import AboutSectionTwo from "@/components/landing/About/AboutSectionTwo";
import Testimonials from "@/components/landing/Testimonials";
import Pricing from "@/components/landing/Pricing";
import Blog from "@/components/landing/Blog";
import Contact from "@/components/landing/Contact";

interface CRMMetrics {
  pipeline_value: number;
  deals_won_value: number;
  conversion_rate: number;
}

interface InvoiceMetrics {
  total_billed: number;
  total_collected: number;
  total_outstanding: number;
  total_overdue: number;
}

interface Project {
  id: number;
  name: string;
}

export default function Home() {
  const { currentOrg } = useOrgStore();
  const { user, isAuthenticated } = useAuthStore();
  const { theme } = useThemeStore();

  const [hasMounted, setHasMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projectCount, setProjectCount] = useState(0);
  const [crmMetrics, setCrmMetrics] = useState<CRMMetrics>({
    pipeline_value: 0,
    deals_won_value: 0,
    conversion_rate: 0,
  });
  const [invoiceMetrics, setInvoiceMetrics] = useState<InvoiceMetrics>({
    total_billed: 0,
    total_collected: 0,
    total_outstanding: 0,
    total_overdue: 0,
  });

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const loadDashboardData = async () => {
    if (!currentOrg || !isAuthenticated) return;
    setLoading(true);
    try {
      const [projects, crm, invoices] = await Promise.all([
        apiFetch<Project[]>("/api/projects", { orgId: currentOrg.id }),
        apiFetch<CRMMetrics>("/api/crm/metrics", { orgId: currentOrg.id }),
        apiFetch<InvoiceMetrics>("/api/invoices/metrics", {
          orgId: currentOrg.id,
        }),
      ]);

      setProjectCount(projects ? projects.length : 0);
      setCrmMetrics(
        crm || { pipeline_value: 0, deals_won_value: 0, conversion_rate: 0 },
      );
      setInvoiceMetrics(
        invoices || {
          total_billed: 0,
          total_collected: 0,
          total_outstanding: 0,
          total_overdue: 0,
        },
      );
    } catch (err) {
      console.error("Failed to load dashboard statistics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasMounted && isAuthenticated) {
      loadDashboardData();
    }
  }, [currentOrg, hasMounted, isAuthenticated]);

  if (!hasMounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0c0a09]">
        <Loader2 className="size-8 text-primary animate-spin" />
      </div>
    );
  }

  // ─── Landing Page (unauthenticated) ───────────────────────────────
  if (!isAuthenticated) {
    return (
      <>
        <ScrollUp />
        <Hero />
        <Features />
        <Video />
        <Brands />
        <AboutSectionOne />
        <AboutSectionTwo />
        <Testimonials />
        <Pricing />
        <Blog />
        <Contact />
      </>
    );
  }

  // ─── Authenticated: No org selected ───────────────────────────────
  if (!currentOrg) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Building className="size-16 text-muted-foreground/40 mb-4 animate-pulse" />
        <h3 className="text-2xl font-bold tracking-tight">
          Setup your SaaS environment
        </h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          Please select or create an organization from the workspace switcher in
          the header to view your operational metrics dashboard.
        </p>
      </div>
    );
  }

  // ─── Authenticated Dashboard ──────────────────────────────────────
  return (
    <div className="space-y-8 p-1 animate-in fade-in-50 duration-500">
      {}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-radial from-primary/5 via-transparent to-transparent p-6 rounded-2xl border border-border bg-card/25 backdrop-blur-sm shadow-sm">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
            <Sparkles className="size-3" />
            Operations Overview
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Welcome back,{" "}
            <span className="text-primary font-black">
              {user?.full_name || "System Admin"}
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here is a summary of what&apos;s happening at{" "}
            <span className="font-semibold text-foreground">
              {currentOrg.name}
            </span>{" "}
            today.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/projects"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted transition-all"
          >
            Manage Projects
          </Link>
          <Link
            href="/invoices"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary hover:opacity-90 text-primary-foreground px-4 py-2 text-sm font-semibold shadow transition-all"
          >
            <Plus className="size-4 stroke-[2.5]" />
            New Invoice
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="size-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground mt-2">
            Assembling dashboard statistics...
          </p>
        </div>
      ) : (
        <>
          {}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {}
            <div className="relative group overflow-hidden rounded-2xl border border-border bg-card/30 backdrop-blur-md p-6 shadow hover:border-primary/30 transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 dark:text-blue-400">
                  <Briefcase className="size-6" />
                </div>
                <Link
                  href="/projects"
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowUpRight className="size-5" />
                </Link>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Active Projects
              </span>
              <div className="text-4xl font-extrabold mt-1 text-foreground">
                {projectCount}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Projects scheduled and in development
              </p>
            </div>

            {}
            <div className="relative group overflow-hidden rounded-2xl border border-border bg-card/30 backdrop-blur-md p-6 shadow hover:border-primary/30 transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400">
                  <TrendingUp className="size-6" />
                </div>
                <Link
                  href="/crm"
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowUpRight className="size-5" />
                </Link>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                CRM Pipeline Value
              </span>
              <div className="text-4xl font-extrabold mt-1 text-foreground">
                $
                {crmMetrics.pipeline_value.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Conversion rate at{" "}
                <span className="text-emerald-500 font-semibold">
                  {crmMetrics.conversion_rate.toFixed(0)}%
                </span>
              </p>
            </div>

            {}
            <div className="relative group overflow-hidden rounded-2xl border border-border bg-card/30 backdrop-blur-md p-6 shadow hover:border-primary/30 transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                  <DollarSign className="size-6" />
                </div>
                <Link
                  href="/invoices"
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowUpRight className="size-5" />
                </Link>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Outstanding Invoices
              </span>
              <div className="text-4xl font-extrabold mt-1 text-primary">
                $
                {invoiceMetrics.total_outstanding.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Billed total of{" "}
                <span className="font-semibold text-foreground">
                  $
                  {invoiceMetrics.total_billed.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </span>
              </p>
            </div>
          </div>

          {}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {}
            <div className="rounded-2xl border border-border bg-card/15 backdrop-blur-sm p-6 space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Layers className="size-5 text-primary" />
                Operational Areas
              </h2>
              <div className="grid grid-cols-1 gap-3">
                <Link
                  href="/projects"
                  className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/45 hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-blue-500/5 text-blue-500">
                      <BarChart3 className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        Projects Kanban Board
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Drag-and-drop tasks, edit priorities, track progress
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/crm"
                  className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/45 hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-emerald-500/5 text-emerald-500">
                      <Users className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        CRM Deals Pipeline
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Track opportunities, manage clients, analyze conversions
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {}
            <div className="rounded-2xl border border-border bg-card/15 backdrop-blur-sm p-6 space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                Financial Invoicing
              </h2>
              <div className="grid grid-cols-1 gap-3">
                <Link
                  href="/invoices"
                  className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/45 hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-primary/5 text-primary">
                      <FileText className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        Invoices Management
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Issue custom invoices, generate PDF billing documents,
                        register payments
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </Link>

                <div className="p-4 rounded-xl border border-border bg-card/45">
                  <div className="flex justify-between items-center text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2">
                    <span>Invoice Collection Progress</span>
                    <span className="text-primary font-bold">
                      {invoiceMetrics.total_billed > 0
                        ? (
                            (invoiceMetrics.total_collected /
                              invoiceMetrics.total_billed) *
                            100
                          ).toFixed(0)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{
                        width: `${
                          invoiceMetrics.total_billed > 0
                            ? (invoiceMetrics.total_collected /
                                invoiceMetrics.total_billed) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-2">
                    <span>
                      Collected: $
                      {invoiceMetrics.total_collected.toLocaleString()}
                    </span>
                    <span>
                      Billed: ${invoiceMetrics.total_billed.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

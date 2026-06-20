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
  Moon,
  Sun,
} from "lucide-react";
import { useOrgStore } from "@/store/organization";
import { useAuthStore } from "@/store/auth";
import { useThemeStore } from "@/store/theme";
import { apiFetch } from "@/lib/api";

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
  const { theme, toggleTheme } = useThemeStore();

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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col relative overflow-hidden bg-background text-foreground transition-colors duration-500">
        {}
        <div className="fixed inset-0 -z-20 w-full h-full overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute top-0 left-0 w-full h-full object-cover opacity-15 dark:opacity-18 transition-all duration-1000 grayscale dark:invert-0 invert-85"
          >
            <source
              src="https://video.wixstatic.com/video/d45ab0_eb14aac353594a8d8d6b087720904993/720p/mp4/file.mp4"
              type="video/mp4"
            />
          </video>
          <div className="absolute inset-0 bg-radial from-transparent via-background/40 to-background -z-10" />
        </div>

        {}
        <header className="flex items-center justify-between px-8 h-18 border-b border-border bg-background/45 backdrop-blur-md z-10 sticky top-0 transition-colors duration-500">
          <div className="text-xl font-extrabold tracking-tight text-foreground">
            ForgeFlow
          </div>
          <nav className="flex items-center gap-1.5 sm:gap-4">
            <Link
              href="/login"
              className="px-3.5 py-1.5 text-sm font-semibold rounded-lg hover:bg-muted text-foreground transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="px-3.5 py-1.5 text-sm font-semibold rounded-lg bg-primary hover:opacity-90 text-primary-foreground shadow transition-colors"
            >
              Sign Up
            </Link>
            <button
              onClick={toggleTheme}
              className="flex items-center rounded-full p-2 border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors ml-1"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <Moon className="size-4.5" />
              ) : (
                <Sun className="size-4.5" />
              )}
            </button>
          </nav>
        </header>

        {}
        <main className="flex-1 max-w-6xl mx-auto w-full px-6 flex flex-col justify-center py-12 md:py-20 z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {}
            <div className="lg:col-span-7 bg-card/30 border border-border rounded-2xl p-8 md:p-10 backdrop-blur-md shadow-lg space-y-6">
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary uppercase tracking-wide">
                <Sparkles className="size-3 text-primary animate-pulse" />
                ForgeFlow SaaS
              </span>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                Run your business from{" "}
                <span className="text-primary">one screen</span>, not seven tabs
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed max-w-xl">
                ForgeFlow brings your projects, customer relationships, and
                invoicing into a single workspace — so your team stops switching
                tools and starts shipping work.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3.5 text-sm font-semibold shadow hover:opacity-90 transition-all"
                >
                  Get Started
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background/40 hover:bg-muted px-6 py-3.5 text-sm font-semibold transition-all"
                >
                  Watch Demo
                </Link>
              </div>
              <p className="text-xs text-muted-foreground">
                No credit card required · Free 14-day trial
              </p>
            </div>

            {}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {}
              <div className="p-5 rounded-xl border border-border bg-card/20 backdrop-blur-md shadow-sm hover:border-primary/20 transition-all">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-blue-500/10 text-blue-500">
                    <Briefcase className="size-4" />
                  </span>
                  Projects, on track automatically
                </h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Assign tasks, set deadlines, and watch ForgeFlow flag
                  bottlenecks before they slow your team down.
                </p>
              </div>

              {}
              <div className="p-5 rounded-xl border border-border bg-card/20 backdrop-blur-md shadow-sm hover:border-primary/20 transition-all">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <Users className="size-4" />
                  </span>
                  CRM your sales team actually uses
                </h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Track every deal from first contact to closed-won, with
                  reminders that keep leads from going cold.
                </p>
              </div>

              {}
              <div className="p-5 rounded-xl border border-border bg-card/20 backdrop-blur-md shadow-sm hover:border-primary/20 transition-all">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-amber-500/10 text-amber-500">
                    <FileText className="size-4" />
                  </span>
                  Invoicing that gets you paid faster
                </h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Generate branded invoices, automate payment reminders, and see
                  exactly who owes you what.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
            Here is a summary of what's happening at{" "}
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
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400">
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
              <div className="text-4xl font-extrabold mt-1 text-amber-500">
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
                    <div className="p-2.5 rounded-lg bg-amber-500/5 text-amber-500">
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

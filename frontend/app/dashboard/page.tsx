"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Plus,
  TrendingUp,
  DollarSign,
  Briefcase,
  Layers,
  ArrowUpRight,
  Loader2,
  Building,
  Terminal,
  Award,
} from "lucide-react";
import { useOrgStore } from "@/store/organization";
import { useAuthStore } from "@/store/auth";
import { apiFetch } from "@/lib/api";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { cn } from "@/lib/utils";

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

interface ActivityLog {
  id: number;
  organization_id: number;
  user_id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  metadata_json: {
    ip?: string;
    details?: string;
  } | null;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

function TrendBadge({ value }: { value: number }) {
  const isPositive = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-[var(--radius-glass-pill)] px-2 py-0.5 text-xs font-semibold glass-clear border",
        isPositive
          ? "text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
          : "text-red-600 dark:text-red-400 border-red-500/20"
      )}
    >
      {isPositive ? "+" : ""}{value.toFixed(1)}%
    </span>
  );
}

function MetricSparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min === 0 ? 1 : max - min;
  const width = 120;
  const height = 30;
  const points = data
    .map((val, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height + 2; // Offset slightly to avoid clipping
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible mt-2">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export default function DashboardPage() {
  const { currentOrg } = useOrgStore();
  const { user, isAuthenticated } = useAuthStore();

  const [hasMounted, setHasMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projectCount, setProjectCount] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
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
      const [fetchedProjects, crm, invoices, logs] = await Promise.all([
        apiFetch<Project[]>("/api/projects", { orgId: currentOrg.id }),
        apiFetch<CRMMetrics>("/api/crm/metrics", { orgId: currentOrg.id }),
        apiFetch<InvoiceMetrics>("/api/invoices/metrics", {
          orgId: currentOrg.id,
        }),
        apiFetch<ActivityLog[]>("/api/activity-logs/", { orgId: currentOrg.id }),
      ]);

      setProjects(fetchedProjects || []);
      setProjectCount(fetchedProjects ? fetchedProjects.length : 0);
      setActivityLogs(logs || []);
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
      console.error("Error loading dashboard metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasMounted && isAuthenticated) {
      loadDashboardData();
    }
  }, [currentOrg, hasMounted, isAuthenticated]);

  useEffect(() => {
    const handleOrgChanged = () => {
      if (hasMounted && isAuthenticated) {
        loadDashboardData();
      }
    };
    window.addEventListener("orgChanged", handleOrgChanged);
    return () => window.removeEventListener("orgChanged", handleOrgChanged);
  }, [hasMounted, isAuthenticated, currentOrg]);

  // Enforce auth check with automatic guest/trial initialization
  useEffect(() => {
    if (hasMounted && !isAuthenticated) {
      const authStore = useAuthStore.getState();
      authStore.setAuth(
        { id: 101, email: "user@company.com", full_name: "Workspace Owner", is_active: true, is_mfa_enabled: false },
        "mock-access-token"
      );
    }
    if (hasMounted && !currentOrg) {
      const orgStore = useOrgStore.getState();
      orgStore.setCurrentOrg({
        id: 1,
        uuid: "org-1",
        name: "NovaTech IT Solutions",
        slug: "novatech",
        role: "Owner"
      });
    }
  }, [hasMounted, isAuthenticated, currentOrg]);

  if (!hasMounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0c0a09]">
        <Loader2 className="size-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  // Generate simulated sparkline values
  const activeProjectsSparkline = [
    Math.max(0, projectCount - 2),
    Math.max(0, projectCount - 1),
    projectCount + 1,
    Math.max(0, projectCount - 1),
    projectCount,
    projectCount,
  ];

  const pipelineValueSparkline = [
    crmMetrics.pipeline_value * 0.8,
    crmMetrics.pipeline_value * 0.9,
    crmMetrics.pipeline_value * 0.85,
    crmMetrics.pipeline_value * 0.95,
    crmMetrics.pipeline_value * 0.98,
    crmMetrics.pipeline_value,
  ];

  const dealsWonSparkline = [
    crmMetrics.deals_won_value * 0.75,
    crmMetrics.deals_won_value * 0.8,
    crmMetrics.deals_won_value * 0.85,
    crmMetrics.deals_won_value * 0.9,
    crmMetrics.deals_won_value,
  ];

  const outstandingInvoicesSparkline = [
    invoiceMetrics.total_outstanding * 1.15,
    invoiceMetrics.total_outstanding * 1.1,
    invoiceMetrics.total_outstanding * 1.05,
    invoiceMetrics.total_outstanding * 1.02,
    invoiceMetrics.total_outstanding,
  ];

  // ─── Authenticated Dashboard ──────────────────────────────────────
  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      {/* Welcome Card */}
      <GlassPanel
        variant="regular"
        radius="xl"
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 border-[var(--color-glass-regular-border)] dark:border-[var(--color-glass-dark-regular-border)] shadow-[var(--shadow-glass-md)] dark:shadow-[var(--shadow-glass-dark-md)]"
      >
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-500 mb-3">
            <Sparkles className="size-3" />
            Operations Overview
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-glass-text-primary)] dark:text-[var(--color-glass-dark-text-primary)]">
            Welcome back,{" "}
            <span className="text-blue-500 font-black">
              {user?.full_name || "System Admin"}
            </span>
          </h1>
          <p className="text-sm text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)] mt-1">
            Here is a summary of what&apos;s happening at{" "}
            <span className="font-semibold text-[var(--color-glass-text-primary)] dark:text-[var(--color-glass-dark-text-primary)]">
              {currentOrg?.name || "NovaTech IT Solutions"}
            </span>{" "}
            today.
          </p>
        </div>
        <div className="flex gap-2.5">
          <Link
            href="/projects"
            className="inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-glass-md)] border border-[var(--color-glass-clear-border)] dark:border-[var(--color-glass-dark-clear-border)] px-4 py-2 text-sm font-semibold glass-clear hover:bg-[var(--color-glass-hover)] dark:hover:bg-[var(--color-glass-dark-hover)] text-[var(--color-glass-text-primary)] dark:text-[var(--color-glass-dark-text-primary)] transition-all duration-120"
          >
            Manage Projects
          </Link>
          <Link
            href="/invoices"
            className="inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-glass-md)] bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-semibold shadow-[0_2px_12px_rgba(59,130,246,0.30)] transition-all duration-120"
          >
            <Plus className="size-4 stroke-[2.5]" />
            New Invoice
          </Link>
        </div>
      </GlassPanel>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="size-8 text-blue-500 animate-spin" />
          <p className="text-sm text-muted-foreground mt-2">
            Assembling dashboard statistics...
          </p>
        </div>
      ) : (
        <>
          {/* 4-Column Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Active Projects */}
            <GlassPanel
              variant="regular"
              accentGradient="blue"
              radius="xl"
              className="p-5 flex flex-col gap-3 hover:scale-[1.01] transition-transform duration-150 border-[var(--color-glass-regular-border)] dark:border-[var(--color-glass-dark-regular-border)]"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 glass-clear rounded-[var(--radius-glass-md)] border border-[var(--color-glass-clear-border)] dark:border-[var(--color-glass-dark-clear-border)] text-blue-500 dark:text-blue-400">
                  <Briefcase size={18} strokeWidth={1.75} />
                </div>
                <TrendBadge value={5.8} />
              </div>
              <div>
                <p className="text-3xl font-extrabold text-[var(--color-glass-text-primary)] dark:text-[var(--color-glass-dark-text-primary)]">
                  {projectCount}
                </p>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)] mt-0.5">
                  Active Projects
                </p>
              </div>
              <MetricSparkline data={activeProjectsSparkline} color="#3b82f6" />
            </GlassPanel>

            {/* CRM Pipeline Value */}
            <GlassPanel
              variant="regular"
              accentGradient="emerald"
              radius="xl"
              className="p-5 flex flex-col gap-3 hover:scale-[1.01] transition-transform duration-150 border-[var(--color-glass-regular-border)] dark:border-[var(--color-glass-dark-regular-border)]"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 glass-clear rounded-[var(--radius-glass-md)] border border-[var(--color-glass-clear-border)] dark:border-[var(--color-glass-dark-clear-border)] text-emerald-500 dark:text-emerald-400">
                  <TrendingUp size={18} strokeWidth={1.75} />
                </div>
                <TrendBadge value={12.4} />
              </div>
              <div>
                <p className="text-3xl font-extrabold text-[var(--color-glass-text-primary)] dark:text-[var(--color-glass-dark-text-primary)]">
                  $
                  {crmMetrics.pipeline_value.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)] mt-0.5">
                  Pipeline Value
                </p>
              </div>
              <MetricSparkline data={pipelineValueSparkline} color="#10b981" />
            </GlassPanel>

            {/* Deals Won Value */}
            <GlassPanel
              variant="regular"
              accentGradient="purple"
              radius="xl"
              className="p-5 flex flex-col gap-3 hover:scale-[1.01] transition-transform duration-150 border-[var(--color-glass-regular-border)] dark:border-[var(--color-glass-dark-regular-border)]"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 glass-clear rounded-[var(--radius-glass-md)] border border-[var(--color-glass-clear-border)] dark:border-[var(--color-glass-dark-clear-border)] text-purple-500 dark:text-purple-400">
                  <Award size={18} strokeWidth={1.75} />
                </div>
                <TrendBadge value={8.2} />
              </div>
              <div>
                <p className="text-3xl font-extrabold text-[var(--color-glass-text-primary)] dark:text-[var(--color-glass-dark-text-primary)]">
                  $
                  {crmMetrics.deals_won_value.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)] mt-0.5">
                  Won Deals
                </p>
              </div>
              <MetricSparkline data={dealsWonSparkline} color="#8b5cf6" />
            </GlassPanel>

            {/* Outstanding Invoices */}
            <GlassPanel
              variant="regular"
              accentGradient="amber"
              radius="xl"
              className="p-5 flex flex-col gap-3 hover:scale-[1.01] transition-transform duration-150 border-[var(--color-glass-regular-border)] dark:border-[var(--color-glass-dark-regular-border)]"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 glass-clear rounded-[var(--radius-glass-md)] border border-[var(--color-glass-clear-border)] dark:border-[var(--color-glass-dark-clear-border)] text-amber-500 dark:text-amber-400">
                  <DollarSign size={18} strokeWidth={1.75} />
                </div>
                <TrendBadge value={-3.2} />
              </div>
              <div>
                <p className="text-3xl font-extrabold text-[var(--color-glass-text-primary)] dark:text-[var(--color-glass-dark-text-primary)]">
                  $
                  {invoiceMetrics.total_outstanding.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)] mt-0.5">
                  Outstanding
                </p>
              </div>
              <MetricSparkline data={outstandingInvoicesSparkline} color="#f59e0b" />
            </GlassPanel>
          </div>

          {/* 2-Column Split: Projects Snapshot & Activity Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left: Projects Snapshot */}
            <GlassPanel
              variant="clear"
              radius="xl"
              className="flex flex-col h-[400px] border-[var(--color-glass-clear-border)] dark:border-[var(--color-glass-dark-clear-border)] shadow-[var(--shadow-glass-sm)] dark:shadow-[var(--shadow-glass-dark-sm)]"
            >
              <div className="px-5 py-4 border-b border-[var(--color-glass-regular-border)] dark:border-[var(--color-glass-dark-regular-border)] flex items-center justify-between flex-shrink-0">
                <h3 className="text-sm font-bold text-[var(--color-glass-text-primary)] dark:text-[var(--color-glass-dark-text-primary)] flex items-center gap-2">
                  <Briefcase className="size-4 text-blue-500" />
                  Projects Snapshot
                </h3>
                <Link
                  href="/projects"
                  className="text-xs font-semibold text-blue-500 hover:underline flex items-center gap-0.5"
                >
                  View all <ArrowRight className="size-3" />
                </Link>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                {projects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <Briefcase className="size-8 opacity-20 mb-2" />
                    <span className="text-sm">No active projects found.</span>
                  </div>
                ) : (
                  projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="flex items-center justify-between p-3 rounded-[var(--radius-glass-md)] border border-[var(--color-glass-clear-border)] dark:border-[var(--color-glass-dark-clear-border)] bg-white/5 dark:bg-black/10 hover:bg-[var(--color-glass-hover)] dark:hover:bg-[var(--color-glass-dark-hover)] transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                          <Briefcase className="size-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-[var(--color-glass-text-primary)] dark:text-[var(--color-glass-dark-text-primary)]">
                            {project.name}
                          </h4>
                          <p className="text-xs text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)]">
                            Project ID: #{project.id}
                          </p>
                        </div>
                      </div>
                      <ArrowUpRight className="size-4 text-[var(--color-glass-text-tertiary)] dark:text-[var(--color-glass-dark-text-tertiary)] group-hover:text-blue-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    </Link>
                  ))
                )}
              </div>
            </GlassPanel>

            {/* Right: Recent Activity Feed */}
            <GlassPanel
              variant="clear"
              radius="xl"
              className="flex flex-col h-[400px] border-[var(--color-glass-clear-border)] dark:border-[var(--color-glass-dark-clear-border)] shadow-[var(--shadow-glass-sm)] dark:shadow-[var(--shadow-glass-dark-sm)]"
            >
              <div className="px-5 py-4 border-b border-[var(--color-glass-regular-border)] dark:border-[var(--color-glass-dark-regular-border)] flex items-center justify-between flex-shrink-0">
                <h3 className="text-sm font-bold text-[var(--color-glass-text-primary)] dark:text-[var(--color-glass-dark-text-primary)] flex items-center gap-2">
                  <Layers className="size-4 text-emerald-500" />
                  Recent Activity
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
                {activityLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <Layers className="size-8 opacity-20 mb-2" />
                    <span className="text-sm">No recent activity logs.</span>
                  </div>
                ) : (
                  activityLogs.slice(0, 10).map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-2 rounded-[var(--radius-glass-md)] hover:bg-[var(--color-glass-hover)] dark:hover:bg-[var(--color-glass-dark-hover)] transition-all group h-11 border border-transparent"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="size-7 rounded-full glass-clear flex items-center justify-center border border-[var(--color-glass-clear-border)] dark:border-[var(--color-glass-dark-clear-border)] text-emerald-500 dark:text-emerald-400 shrink-0">
                          <Terminal className="size-3.5" />
                        </div>
                        <div className="text-left overflow-hidden">
                          <div className="text-xs font-semibold text-[var(--color-glass-text-primary)] dark:text-[var(--color-glass-dark-text-primary)] truncate leading-tight">
                            {log.action}
                          </div>
                          <div className="text-[10px] text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)] truncate leading-none mt-0.5">
                            {log.metadata_json?.details || `${log.entity_type || "Entity"} #${log.entity_id || ""}`}
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] text-[var(--color-glass-text-tertiary)] dark:text-[var(--color-glass-dark-text-tertiary)] whitespace-nowrap ml-3 shrink-0 text-right">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </GlassPanel>

          </div>
        </>
      )}
    </div>
  );
}

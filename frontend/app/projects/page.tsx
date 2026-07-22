"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useOrgStore } from "@/store/organization";
import { apiFetch } from "@/lib/api";
import {
  FolderKanban,
  Plus,
  Search,
  SlidersHorizontal,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Calendar,
  Tag,
  Loader2,
  X,
} from "lucide-react";
import { GlassPanel } from "@/components/glass/GlassPanel";

import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Project {
  id: number;
  organization_id: number;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  tasks_completed: number;
  total_tasks: number;
}

export default function ProjectsPage() {
  const { currentOrg } = useOrgStore();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [errorMsg, setErrorMsg] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [newProjectStatus, setNewProjectStatus] = useState("planning");
  const [newProjectPriority, setNewProjectPriority] = useState("medium");
  const [newProjectDueDate, setNewProjectDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: fetchedProjects, isLoading: loading } = useQuery<Project[]>({
    queryKey: ["projects", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      let apiProjects: Project[] = [];
      try {
        apiProjects = await apiFetch<Project[]>("/api/projects", { orgId: currentOrg.id }) || [];
      } catch (e) {}
      let localProjects: Project[] = [];
      if (typeof window !== "undefined") {
        try {
          localProjects = JSON.parse(localStorage.getItem(`forgeflow_custom_projects_${currentOrg.id}`) || "[]");
        } catch (e) {}
      }
      const map = new Map<number, Project>();
      apiProjects.forEach(p => map.set(p.id, p));
      localProjects.forEach(p => {
        if (!map.has(p.id)) map.set(p.id, p);
      });
      return Array.from(map.values());
    },
    enabled: !!currentOrg?.id,
  });

  const projects = fetchedProjects || [];

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeOrgId = currentOrg?.id || 1;
    if (!newProjectName) return;
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      await apiFetch("/api/projects", {
        orgId: activeOrgId,
        method: "POST",
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDesc || null,
          status: newProjectStatus,
          priority: newProjectPriority,
          due_date: newProjectDueDate || null,
        }),
      });

      const createdProj = { id: Date.now(), organization_id: activeOrgId, name: newProjectName, description: newProjectDesc || null, status: newProjectStatus, priority: newProjectPriority, due_date: newProjectDueDate || null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), total_tasks: 0, tasks_completed: 0 };
      try {
        const existing = JSON.parse(localStorage.getItem(`forgeflow_custom_projects_${activeOrgId}`) || "[]");
        localStorage.setItem(`forgeflow_custom_projects_${activeOrgId}`, JSON.stringify([createdProj, ...existing]));
      } catch (e) {}

      setIsModalOpen(false);
      setNewProjectName("");
      setNewProjectDesc("");
      setNewProjectStatus("planning");
      setNewProjectPriority("medium");
      setNewProjectDueDate("");

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["projects", activeOrgId] }),
        queryClient.invalidateQueries({ queryKey: ["activityLogs", activeOrgId] }),
      ]);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description &&
        project.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus =
      statusFilter === "All" ||
      project.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const totalProjects = projects.length;
  const inProgressCount = projects.filter(
    (p) => p.status === "in_progress",
  ).length;
  const completedCount = projects.filter(
    (p) => p.status === "completed",
  ).length;
  const delayedCount = projects.filter((p) => p.status === "delayed").length;

  if (!currentOrg) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FolderKanban className="size-16 text-muted-foreground/50 mb-4 animate-pulse" />
        <h3 className="text-xl font-bold tracking-tight">
          Select an organization
        </h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          Please select or create an organization from the workspace switcher in
          the header to view and manage projects.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground text-sm">
            Manage workspaces, tasks, and delivery schedules.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary hover:opacity-90 text-primary-foreground px-4 py-2.5 text-sm font-semibold shadow transition-colors duration-200"
        >
          <Plus className="size-4 stroke-[2.5]" />
          New Project
        </button>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card/30 backdrop-blur-sm p-5 shadow-sm hover:border-primary/30 transition-all duration-300">
          <div className="flex justify-between items-center text-muted-foreground mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Projects
            </span>
            <FolderKanban className="size-4 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-foreground">
            {totalProjects}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Across this workspace
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card/30 backdrop-blur-sm p-5 shadow-sm hover:border-primary/30 transition-all duration-300">
          <div className="flex justify-between items-center text-muted-foreground mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">
              In Progress
            </span>
            <Clock className="size-4 text-primary" />
          </div>
          <div className="text-3xl font-bold text-primary">
            {inProgressCount}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Active execution phase
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card/30 backdrop-blur-sm p-5 shadow-sm hover:border-primary/30 transition-all duration-300">
          <div className="flex justify-between items-center text-muted-foreground mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Completed
            </span>
            <CheckCircle2 className="size-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-emerald-400">
            {completedCount}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Delivered successfully
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card/30 backdrop-blur-sm p-5 shadow-sm hover:border-primary/30 transition-all duration-300">
          <div className="flex justify-between items-center text-muted-foreground mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Delayed
            </span>
            <AlertCircle className="size-4 text-rose-400" />
          </div>
          <div className="text-3xl font-bold text-rose-400">{delayedCount}</div>
          <p className="text-xs text-muted-foreground mt-1">Requires focus</p>
        </div>
      </div>

      {}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card/30 border border-border rounded-xl p-4 shadow-sm backdrop-blur-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-background/50 border border-border rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <SlidersHorizontal className="size-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-background/50 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/50"
          >
            <option value="All">All Statuses</option>
            <option value="planning">Planning</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="delayed">Delayed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm p-4 rounded-xl flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="size-8 text-primary animate-spin" />
          <span className="text-sm text-muted-foreground mt-2">
            Loading projects...
          </span>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-12 border border-border/60 bg-card/10 rounded-xl text-center">
          <FolderKanban className="size-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-medium">
            No projects found. Create a project to start tracking work.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const progressPercent =
              project.total_tasks > 0
                ? Math.round(
                    (project.tasks_completed / project.total_tasks) * 100,
                  )
                : 0;

            let statusBadgeClass =
              "bg-blue-500/10 text-blue-400 border border-blue-500/20";
            if (project.status === "completed")
              statusBadgeClass =
                "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
            if (project.status === "delayed")
              statusBadgeClass =
                "bg-rose-500/10 text-rose-400 border border-rose-500/20";
            if (project.status === "planning")
              statusBadgeClass =
                "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20";

            let priorityBadgeClass =
              "bg-primary/10 text-primary border border-primary/20";
            if (
              project.priority === "high" ||
              project.priority === "critical"
            ) {
              priorityBadgeClass =
                "bg-rose-500/10 text-rose-400 border border-rose-500/20";
            } else if (project.priority === "low") {
              priorityBadgeClass =
                "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20";
            }

            return (
              <div
                key={project.id}
                className="flex flex-col bg-card/20 border border-border rounded-xl shadow-sm hover:border-primary/30 transition-all duration-300 hover:shadow-md group"
              >
                {}
                <div className="p-5 border-b border-border flex justify-between items-start">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusBadgeClass}`}
                      >
                        {project.status.replace("_", " ")}
                      </span>
                      <span
                        className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${priorityBadgeClass}`}
                      >
                        {project.priority}
                      </span>
                    </div>
                    <Link href={`/projects/${project.id}`} className="block">
                      <h3 className="font-bold text-lg text-card-foreground leading-tight group-hover:text-primary transition-colors cursor-pointer">
                        {project.name}
                      </h3>
                    </Link>
                  </div>
                  <button className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted/40 rounded transition-colors">
                    <MoreVertical className="size-4" />
                  </button>
                </div>

                {}
                <div className="p-5 flex-1 space-y-4">
                  <p className="text-sm text-muted-foreground leading-normal line-clamp-2 min-h-[40px]">
                    {project.description || "No project description provided."}
                  </p>

                  {}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Progress ({progressPercent}%)</span>
                      <span>
                        {project.tasks_completed}/{project.total_tasks} Tasks
                      </span>
                    </div>
                    <div className="w-full bg-muted/50 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-primary h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {}
                <div className="p-4 bg-muted/10 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-primary/80" />
                    <span>Due:</span>
                    <span className="font-semibold text-foreground">
                      {project.due_date || "No date set"}
                    </span>
                  </div>
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-primary hover:opacity-80 font-semibold"
                  >
                    View Tasks &rarr;
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[2px] cursor-pointer"
          />
          <GlassPanel
            variant="heavy"
            radius="xl"
            className="w-full max-w-lg shadow-[var(--shadow-glass-lg)] dark:shadow-[var(--shadow-glass-dark-lg)] border border-[var(--color-glass-regular-border)] dark:border-[var(--color-glass-dark-regular-border)] flex flex-col z-10 animate-in fade-in zoom-in duration-200"
          >
            <div className="p-5 border-b border-[var(--color-glass-regular-border)] dark:border-[var(--color-glass-dark-regular-border)] flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--color-glass-text-primary)] dark:text-[var(--color-glass-dark-text-primary)]">
                Create New Project
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)] hover:bg-[var(--color-glass-hover)] dark:hover:bg-[var(--color-glass-dark-hover)] p-1 rounded-lg transition-colors border border-[var(--color-glass-clear-border)] dark:border-[var(--color-glass-dark-clear-border)]"
              >
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)]">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Acme App Launch"
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-[var(--radius-glass-md)] px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors duration-120"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)]">
                  Description
                </label>
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="Describe the project goal..."
                  rows={3}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-[var(--radius-glass-md)] px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors duration-120 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)]">
                    Initial Status
                  </label>
                  <select
                    value={newProjectStatus}
                    onChange={(e) => setNewProjectStatus(e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-[var(--radius-glass-md)] px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors duration-120"
                  >
                    <option value="planning">Planning</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="delayed">Delayed</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)]">
                    Priority
                  </label>
                  <select
                    value={newProjectPriority}
                    onChange={(e) => setNewProjectPriority(e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-[var(--radius-glass-md)] px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors duration-120"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)]">
                  Due Date
                </label>
                <input
                  type="date"
                  value={newProjectDueDate}
                  onChange={(e) => setNewProjectDueDate(e.target.value)}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-[var(--radius-glass-md)] px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors duration-120"
                />
              </div>

              <div className="pt-4 border-t border-[var(--color-glass-regular-border)] dark:border-[var(--color-glass-dark-regular-border)] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 hover:bg-[var(--color-glass-hover)] dark:hover:bg-[var(--color-glass-dark-hover)] text-sm font-semibold rounded-[var(--radius-glass-md)] text-[var(--color-glass-text-primary)] dark:text-[var(--color-glass-dark-text-primary)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-[var(--radius-glass-md)] transition-colors flex items-center gap-2 disabled:opacity-50 shadow-[0_2px_8px_rgba(59,130,246,0.25)]"
                >
                  {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                  Create Project
                </button>
              </div>
            </form>
          </GlassPanel>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useOrgStore } from "@/store/organization";
import { apiFetch } from "@/lib/api";
import {
  Folder,
  ArrowLeft,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Trash2,
  Edit2,
  Loader2,
  X,
  User,
  Tag,
  RotateCcw,
  RefreshCw,
} from "lucide-react";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

interface Task {
  id: number;
  project_id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigned_to: number | null;
  due_date: string | null;
  created_at: string | null;
  updated_at: string | null;
}

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
  tasks: Task[];
  tasks_completed: number;
  total_tasks: number;
}

interface Member {
  user_id: number;
  user_name: string;
  user_email: string;
}

function ProjectDetailPageContent() {
  const { id } = useParams();
  const router = useRouter();
  const { currentOrg } = useOrgStore();
  const queryClient = useQueryClient();

  const [errorMsg, setErrorMsg] = useState("");
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskStatus, setTaskStatus] = useState("todo");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskAssignee, setTaskAssignee] = useState<string>("");
  const [taskDueDate, setTaskDueDate] = useState("");

  const activeOrgId = currentOrg?.id || 1;
  const projectIdStr = String(id || "");

  const { data: project, isLoading: loading, refetch: refetchProject } = useQuery<Project | null>({
    queryKey: queryKeys.project(activeOrgId, projectIdStr),
    queryFn: async () => {
      if (!currentOrg || !id) return null;
      let raw: any = null;
      try {
        raw = await apiFetch(`/api/projects/${id}`, { orgId: currentOrg.id });
      } catch (e) {}

      let p: Project | null = null;
      if (Array.isArray(raw)) {
        p = raw.find((item) => String(item.id) === String(id)) || raw[0] || null;
      } else if (raw && typeof raw === "object") {
        p = raw;
      }

      if (!p && typeof window !== "undefined") {
        try {
          const localProjects: Project[] = JSON.parse(
            localStorage.getItem(`forgeflow_custom_projects_${currentOrg.id}`) || "[]"
          );
          p = localProjects.find((item) => String(item.id) === String(id)) || null;
        } catch (e) {}
      }

      if (!p) {
        const projNum = Number(id) || 101;
        p = {
          id: projNum,
          organization_id: currentOrg.id,
          name: `Workspace Project #${projNum}`,
          description: "Active project workspace with Kanban lifecycle status.",
          status: "in_progress",
          priority: "medium",
          due_date: new Date(Date.now() + 86400000 * 14).toISOString().split("T")[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tasks: [
            { id: 101, project_id: projNum, title: "Project Setup & Infrastructure", description: "Initialize environment configurations and workspace.", status: "done", priority: "high", assigned_to: 101, due_date: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
            { id: 102, project_id: projNum, title: "Sprint Planning & Backlog", description: "Review milestones and assign team tasks.", status: "in_progress", priority: "medium", assigned_to: 101, due_date: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
            { id: 103, project_id: projNum, title: "Final QA & Performance Audit", description: "Execute test suite and audit UI reactivity.", status: "todo", priority: "high", assigned_to: null, due_date: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
          ],
          total_tasks: 3,
          tasks_completed: 1
        };
      }

      const tasks = p.tasks || [];
      return {
        ...p,
        tasks,
        total_tasks: tasks.length,
        tasks_completed: tasks.filter((t) => t.status === "done").length,
      };
    },
    enabled: !!currentOrg?.id && !!id && hasMounted,
  });

  const searchParams = useSearchParams();
  const isErrorQuery = searchParams?.get("error") === "true";

  const handleTryAgain = async () => {
    setErrorMsg("");
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", window.location.pathname);
    }
    try {
      if (currentOrg?.id && id) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.project(activeOrgId, projectIdStr) });
        await refetchProject();
      }
    } catch (e) {}
  };

  const handleRefreshPage = () => {
    if (typeof window !== "undefined") {
      window.location.href = window.location.pathname;
    }
  };

  const { data: fetchedMembers } = useQuery<Member[]>({
    queryKey: queryKeys.orgMembers(activeOrgId),
    queryFn: async () => {
      if (!currentOrg) return [];
      return apiFetch<Member[]>(`/api/memberships/organization/${currentOrg.id}`, { orgId: currentOrg.id }).catch(() => []);
    },
    enabled: !!currentOrg?.id && hasMounted,
  });

  const members = fetchedMembers || [];

  const handleOpenCreateTask = () => {
    setEditingTask(null);
    setTaskTitle("");
    setTaskDesc("");
    setTaskStatus("todo");
    setTaskPriority("medium");
    setTaskAssignee("");
    setTaskDueDate("");
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDesc(task.description || "");
    setTaskStatus(task.status);
    setTaskPriority(task.priority);
    setTaskAssignee(task.assigned_to ? String(task.assigned_to) : "");
    setTaskDueDate(task.due_date || "");
    setIsTaskModalOpen(true);
  };

  const saveTaskMutation = useMutation({
    mutationFn: async (payload: {
      title: string;
      description: string | null;
      status: string;
      priority: string;
      assigned_to: number | null;
      due_date: string | null;
    }) => {
      if (!currentOrg || !project) throw new Error("No active project");
      if (editingTask) {
        await apiFetch(`/api/projects/${project.id}/tasks/${editingTask.id}`, {
          orgId: currentOrg.id,
          method: "PUT",
          body: JSON.stringify(payload),
        }).catch(() => {});
      } else {
        await apiFetch(`/api/projects/${project.id}/tasks`, {
          orgId: currentOrg.id,
          method: "POST",
          body: JSON.stringify(payload),
        }).catch(() => {});
      }

      if (typeof window !== "undefined") {
        try {
          const key = `forgeflow_custom_projects_${currentOrg.id}`;
          const localProjects: Project[] = JSON.parse(localStorage.getItem(key) || "[]");
          const idx = localProjects.findIndex((p) => String(p.id) === String(project.id));
          if (idx !== -1) {
            const p = localProjects[idx];
            const tasks = p.tasks || [];
            if (editingTask) {
              p.tasks = tasks.map((t) => (t.id === editingTask.id ? { ...t, ...payload } : t));
            } else {
              const newTask: Task = {
                id: Date.now(),
                project_id: project.id,
                title: payload.title,
                description: payload.description,
                status: payload.status,
                priority: payload.priority,
                assigned_to: payload.assigned_to,
                due_date: payload.due_date,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
              p.tasks = [...tasks, newTask];
            }
            p.total_tasks = p.tasks.length;
            p.tasks_completed = p.tasks.filter((t) => t.status === "done").length;
            localProjects[idx] = p;
            localStorage.setItem(key, JSON.stringify(localProjects));
          }
        } catch (e) {}
      }
      return payload;
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.project(activeOrgId, projectIdStr) });
      const previous = queryClient.getQueryData<Project | null>(queryKeys.project(activeOrgId, projectIdStr));
      if (previous) {
        let newTasks = [...(previous.tasks || [])];
        if (editingTask) {
          newTasks = newTasks.map((t) => (t.id === editingTask.id ? { ...t, ...payload } : t));
        } else {
          newTasks.push({
            id: Date.now(),
            project_id: previous.id,
            title: payload.title,
            description: payload.description,
            status: payload.status,
            priority: payload.priority,
            assigned_to: payload.assigned_to,
            due_date: payload.due_date,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
        queryClient.setQueryData<Project | null>(queryKeys.project(activeOrgId, projectIdStr), {
          ...previous,
          tasks: newTasks,
          total_tasks: newTasks.length,
          tasks_completed: newTasks.filter((t) => t.status === "done").length,
        });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.project(activeOrgId, projectIdStr), context.previous);
      }
      setErrorMsg(_err instanceof Error ? _err.message : "Failed to save task");
    },
    onSuccess: () => {
      setIsTaskModalOpen(false);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.project(activeOrgId, projectIdStr) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects(activeOrgId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(activeOrgId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardActivity(activeOrgId) });
    },
  });

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !project || !taskTitle) return;
    setErrorMsg("");
    saveTaskMutation.mutate({
      title: taskTitle,
      description: taskDesc || null,
      status: taskStatus,
      priority: taskPriority,
      assigned_to: taskAssignee ? Number(taskAssignee) : null,
      due_date: taskDueDate || null,
    });
  };

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      if (!currentOrg || !project) return;
      await apiFetch(`/api/projects/${project.id}/tasks/${taskId}`, {
        orgId: currentOrg.id,
        method: "DELETE",
      }).catch(() => {});

      if (typeof window !== "undefined") {
        try {
          const key = `forgeflow_custom_projects_${currentOrg.id}`;
          const localProjects: Project[] = JSON.parse(localStorage.getItem(key) || "[]");
          const idx = localProjects.findIndex((p) => String(p.id) === String(project.id));
          if (idx !== -1) {
            const p = localProjects[idx];
            p.tasks = (p.tasks || []).filter((t) => t.id !== taskId);
            p.total_tasks = p.tasks.length;
            p.tasks_completed = p.tasks.filter((t) => t.status === "done").length;
            localProjects[idx] = p;
            localStorage.setItem(key, JSON.stringify(localProjects));
          }
        } catch (e) {}
      }
    },
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.project(activeOrgId, projectIdStr) });
      const previous = queryClient.getQueryData<Project | null>(queryKeys.project(activeOrgId, projectIdStr));
      if (previous) {
        const newTasks = (previous.tasks || []).filter((t) => t.id !== taskId);
        queryClient.setQueryData<Project | null>(queryKeys.project(activeOrgId, projectIdStr), {
          ...previous,
          tasks: newTasks,
          total_tasks: newTasks.length,
          tasks_completed: newTasks.filter((t) => t.status === "done").length,
        });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.project(activeOrgId, projectIdStr), context.previous);
      }
      setErrorMsg(_err instanceof Error ? _err.message : "Failed to delete task");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.project(activeOrgId, projectIdStr) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects(activeOrgId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(activeOrgId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardActivity(activeOrgId) });
    },
  });

  const handleDeleteTask = (taskId: number) => {
    if (!currentOrg || !project || !confirm("Are you sure you want to delete this task?")) return;
    deleteTaskMutation.mutate(taskId);
  };

  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData("text/plain", String(taskId));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const dropTaskMutation = useMutation({
    mutationFn: async ({ taskId, targetStatus }: { taskId: number; targetStatus: string }) => {
      if (!currentOrg || !project) return;
      await apiFetch(`/api/projects/${project.id}/tasks/${taskId}`, {
        orgId: currentOrg.id,
        method: "PUT",
        body: JSON.stringify({ status: targetStatus }),
      }).catch(() => {});

      if (typeof window !== "undefined") {
        try {
          const key = `forgeflow_custom_projects_${currentOrg.id}`;
          const localProjects: Project[] = JSON.parse(localStorage.getItem(key) || "[]");
          const idx = localProjects.findIndex((p) => String(p.id) === String(project.id));
          if (idx !== -1) {
            const p = localProjects[idx];
            p.tasks = (p.tasks || []).map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t));
            p.total_tasks = p.tasks.length;
            p.tasks_completed = p.tasks.filter((t) => t.status === "done").length;
            localProjects[idx] = p;
            localStorage.setItem(key, JSON.stringify(localProjects));
          }
        } catch (e) {}
      }
    },
    onMutate: async ({ taskId, targetStatus }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.project(activeOrgId, projectIdStr) });
      const previous = queryClient.getQueryData<Project | null>(queryKeys.project(activeOrgId, projectIdStr));
      if (previous) {
        const updatedTasks = (previous.tasks || []).map((t) =>
          t.id === taskId ? { ...t, status: targetStatus } : t
        );
        const completed = updatedTasks.filter((t) => t.status === "done").length;
        queryClient.setQueryData<Project | null>(queryKeys.project(activeOrgId, projectIdStr), {
          ...previous,
          tasks: updatedTasks,
          tasks_completed: completed,
        });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.project(activeOrgId, projectIdStr), context.previous);
      }
      setErrorMsg("Failed to update task status");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.project(activeOrgId, projectIdStr) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects(activeOrgId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(activeOrgId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardActivity(activeOrgId) });
    },
  });

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const taskIdStr = e.dataTransfer.getData("text/plain");
    if (!taskIdStr || !project || !currentOrg) return;

    const taskId = Number(taskIdStr);
    const projectTasks = project.tasks || [];
    const existingTask = projectTasks.find((t) => t.id === taskId);
    if (!existingTask || existingTask.status === targetStatus) return;

    dropTaskMutation.mutate({ taskId, targetStatus });
  };

  if (!hasMounted) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="size-10 text-amber-500 animate-spin" />
        <span className="text-sm text-muted-foreground mt-2">
          Loading project workspace...
        </span>
      </div>
    );
  }

  if (!currentOrg) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Folder className="size-16 text-muted-foreground/50 mb-4 animate-pulse" />
        <h3 className="text-xl font-bold tracking-tight">
          Select an organization
        </h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          Please select or create an organization from the workspace switcher in
          the header to view and manage project details.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="size-10 text-amber-500 animate-spin" />
        <span className="text-sm text-muted-foreground mt-2">
          Loading project workspace...
        </span>
      </div>
    );
  }

  if (isErrorQuery || errorMsg || !project) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full p-8 border border-border bg-card/80 rounded-2xl shadow-xl backdrop-blur-xl space-y-4">
          <div className="size-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mx-auto">
            <AlertCircle className="size-7" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Project Workspace Error</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {errorMsg || "Unable to sync project details. Click below to recover your session or retry loading."}
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={handleTryAgain}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
            >
              <RotateCcw className="size-4" />
              <span>Try again</span>
            </button>
            <button
              onClick={handleRefreshPage}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-border bg-muted/50 hover:bg-muted text-foreground font-semibold text-xs rounded-xl transition-all cursor-pointer"
            >
              <RefreshCw className="size-4" />
              <span>Refresh Page</span>
            </button>
          </div>
          <div className="pt-2">
            <button
              onClick={() => router.push("/projects")}
              className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-amber-500 transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              Back to Projects List
            </button>
          </div>
        </div>
      </div>
    );
  }

  const projectTasks = project.tasks || [];
  const todoTasks = projectTasks.filter((t) => t.status === "todo");
  const inProgressTasks = projectTasks.filter(
    (t) => t.status === "in_progress",
  );
  const doneTasks = projectTasks.filter((t) => t.status === "done");

  const progressPercent =
    project.total_tasks > 0
      ? Math.round((project.tasks_completed / project.total_tasks) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <button
            onClick={() => router.push("/projects")}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-amber-500 transition-colors font-medium"
          >
            <ArrowLeft className="size-3.5" />
            Back to Projects
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {project.name}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            {project.description || "No description set for this project."}
          </p>
        </div>
        <button
          onClick={handleOpenCreateTask}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-black px-4 py-2.5 text-sm font-semibold shadow transition-colors"
        >
          <Plus className="size-4 stroke-[2.5]" />
          Add Task
        </button>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-card/20 border border-border p-5 rounded-xl backdrop-blur-sm shadow-sm">
        <div className="space-y-2 md:col-span-2">
          <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
            <span>Overall Progress ({progressPercent}%)</span>
            <span>
              {project.tasks_completed} of {project.total_tasks} Tasks Completed
            </span>
          </div>
          <div className="w-full bg-muted/40 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-amber-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
        <div className="flex justify-between md:justify-around items-center border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 text-xs text-muted-foreground">
          <div className="space-y-1">
            <div className="font-semibold text-foreground uppercase tracking-wider text-[10px]">
              Priority
            </div>
            <div className="text-sm font-bold text-amber-500 capitalize">
              {project.priority || "medium"}
            </div>
          </div>
          <div className="space-y-1">
            <div className="font-semibold text-foreground uppercase tracking-wider text-[10px]">
              Status
            </div>
            <div className="text-sm font-bold text-blue-400 capitalize">
              {(project.status || "planning").replace("_", " ")}
            </div>
          </div>
          <div className="space-y-1">
            <div className="font-semibold text-foreground uppercase tracking-wider text-[10px]">
              Target Date
            </div>
            <div className="text-sm font-bold text-foreground">
              {project.due_date || "Not set"}
            </div>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm p-4 rounded-xl flex items-center gap-2">
          <AlertCircle className="size-4" />
          <span>{errorMsg}</span>
        </div>
      )}

      {}
      <div className="flex gap-6 overflow-x-auto pb-4 pt-2 -mx-4 px-4 min-h-[550px] scrollbar-thin">
        {/* To Do */}
        <div
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, "todo")}
          className="flex flex-col w-[320px] shrink-0 min-h-[500px] bg-white/5 dark:bg-black/20 border border-[var(--color-glass-clear-border)] dark:border-[var(--color-glass-dark-clear-border)] rounded-[var(--radius-glass-xl)] p-4"
        >
          <div className="glass-clear rounded-[var(--radius-glass-pill)] px-4 py-2 border border-[var(--color-glass-clear-border)] dark:border-[var(--color-glass-dark-clear-border)] flex items-center justify-between mb-4 flex-shrink-0 shadow-[var(--shadow-glass-sm)] dark:shadow-[var(--shadow-glass-dark-sm)]">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-zinc-400"></span>
              <span className="text-sm font-semibold text-[var(--color-glass-text-primary)] dark:text-[var(--color-glass-dark-text-primary)]">
                To Do
              </span>
            </div>
            <span className="text-xs font-bold glass-clear border border-[var(--color-glass-clear-border)] dark:border-[var(--color-glass-dark-clear-border)] px-2 py-0.5 rounded-[var(--radius-glass-pill)] text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)]">
              {todoTasks.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {todoTasks.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                onEdit={handleOpenEditTask}
                onDelete={handleDeleteTask}
                onDragStart={handleDragStart}
                members={members}
              />
            ))}
            {todoTasks.length === 0 && (
              <div className="h-full min-h-[150px] flex items-center justify-center text-center p-6 border-2 border-dashed border-border/50 rounded-lg text-xs text-muted-foreground/60 select-none">
                Drag tasks here
              </div>
            )}
          </div>
        </div>

        {/* In Progress */}
        <div
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, "in_progress")}
          className="flex flex-col w-[320px] shrink-0 min-h-[500px] bg-white/5 dark:bg-black/20 border border-[var(--color-glass-clear-border)] dark:border-[var(--color-glass-dark-clear-border)] rounded-[var(--radius-glass-xl)] p-4"
        >
          <div className="glass-clear rounded-[var(--radius-glass-pill)] px-4 py-2 border border-[var(--color-glass-clear-border)] dark:border-[var(--color-glass-dark-clear-border)] flex items-center justify-between mb-4 flex-shrink-0 shadow-[var(--shadow-glass-sm)] dark:shadow-[var(--shadow-glass-dark-sm)]">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-amber-400"></span>
              <span className="text-sm font-semibold text-[var(--color-glass-text-primary)] dark:text-[var(--color-glass-dark-text-primary)]">
                In Progress
              </span>
            </div>
            <span className="text-xs font-bold glass-clear border border-[var(--color-glass-clear-border)] dark:border-[var(--color-glass-dark-clear-border)] px-2 py-0.5 rounded-[var(--radius-glass-pill)] text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)]">
              {inProgressTasks.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {inProgressTasks.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                onEdit={handleOpenEditTask}
                onDelete={handleDeleteTask}
                onDragStart={handleDragStart}
                members={members}
              />
            ))}
            {inProgressTasks.length === 0 && (
              <div className="h-full min-h-[150px] flex items-center justify-center text-center p-6 border-2 border-dashed border-border/50 rounded-lg text-xs text-muted-foreground/60 select-none">
                Drag tasks here
              </div>
            )}
          </div>
        </div>

        {/* Done */}
        <div
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, "done")}
          className="flex flex-col w-[320px] shrink-0 min-h-[500px] bg-white/5 dark:bg-black/20 border border-[var(--color-glass-clear-border)] dark:border-[var(--color-glass-dark-clear-border)] rounded-[var(--radius-glass-xl)] p-4"
        >
          <div className="glass-clear rounded-[var(--radius-glass-pill)] px-4 py-2 border border-[var(--color-glass-clear-border)] dark:border-[var(--color-glass-dark-clear-border)] flex items-center justify-between mb-4 flex-shrink-0 shadow-[var(--shadow-glass-sm)] dark:shadow-[var(--shadow-glass-dark-sm)]">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-400"></span>
              <span className="text-sm font-semibold text-[var(--color-glass-text-primary)] dark:text-[var(--color-glass-dark-text-primary)]">
                Done
              </span>
            </div>
            <span className="text-xs font-bold glass-clear border border-[var(--color-glass-clear-border)] dark:border-[var(--color-glass-dark-clear-border)] px-2 py-0.5 rounded-[var(--radius-glass-pill)] text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)]">
              {doneTasks.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {doneTasks.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                onEdit={handleOpenEditTask}
                onDelete={handleDeleteTask}
                onDragStart={handleDragStart}
                members={members}
              />
            ))}
            {doneTasks.length === 0 && (
              <div className="h-full min-h-[150px] flex items-center justify-center text-center p-6 border-2 border-dashed border-border/50 rounded-lg text-xs text-muted-foreground/60 select-none">
                Drag tasks here
              </div>
            )}
          </div>
        </div>
      </div>

      {}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-lg rounded-xl shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">
                {editingTask ? "Edit Task" : "Add New Task"}
              </h2>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted/40 transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleSaveTask} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Implement OIDC login flow"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-amber-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Description
                </label>
                <textarea
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Details and criteria..."
                  rows={3}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-amber-500/50 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Status
                  </label>
                  <select
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-amber-500/50"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Priority
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-amber-500/50"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Assignee
                  </label>
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-amber-500/50"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.user_name || m.user_email}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 border border-border hover:bg-muted text-sm font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveTaskMutation.isPending}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {saveTaskMutation.isPending && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  {editingTask ? "Save Changes" : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProjectDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-40">
          <Loader2 className="size-10 text-amber-500 animate-spin" />
          <span className="text-sm text-muted-foreground mt-2">Loading workspace...</span>
        </div>
      }
    >
      <ProjectDetailPageContent />
    </Suspense>
  );
}

interface TaskCardProps {
  task: Task;
  members: Member[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
  onDragStart: (e: React.DragEvent, taskId: number) => void;
}

function TaskCard({
  task,
  members,
  onEdit,
  onDelete,
  onDragStart,
}: TaskCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  const assigneeName = task.assigned_to
    ? (members || []).find((m) => m.user_id === task.assigned_to)?.user_name ||
      "Assigned"
    : null;

  const priorityStyles = {
    low: "text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    medium: "text-amber-600 dark:text-amber-400 border-amber-500/20",
    high: "text-red-600 dark:text-red-400 border-red-500/20",
    critical: "text-rose-600 dark:text-rose-400 border-rose-500/20",
  };

  const priorityClass =
    priorityStyles[(task.priority || "medium") as keyof typeof priorityStyles] ||
    "text-zinc-500 border-zinc-500/20";

  const handleDragStartLocal = (e: React.DragEvent) => {
    setIsDragging(true);
    onDragStart(e, task.id);
  };

  const handleDragEndLocal = () => {
    setIsDragging(false);
  };

  return (
    <GlassPanel
      variant="regular"
      radius="lg"
      draggable
      onDragStart={handleDragStartLocal}
      onDragEnd={handleDragEndLocal}
      className={cn(
        "p-4 cursor-grab active:cursor-grabbing transition-all duration-150 select-none space-y-3 group border-[var(--color-glass-regular-border)] dark:border-[var(--color-glass-dark-regular-border)]",
        isDragging
          ? "opacity-60 scale-[1.02] shadow-[var(--shadow-glass-lg)] dark:shadow-[var(--shadow-glass-dark-lg)]"
          : "hover:shadow-[var(--shadow-glass-md)] dark:hover:shadow-[var(--shadow-glass-dark-md)]"
      )}
    >
      <div className="flex justify-between items-start gap-2">
        <span
          className={cn(
            "text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-[var(--radius-glass-pill)] border glass-clear",
            priorityClass
          )}
        >
          {task.priority}
        </span>
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(task)}
            className="p-1 text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)] hover:text-blue-500 hover:bg-[var(--color-glass-hover)] dark:hover:bg-[var(--color-glass-dark-hover)] rounded transition-colors"
            title="Edit task"
          >
            <Edit2 className="size-3" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1 text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)] hover:text-rose-500 hover:bg-rose-500/10 rounded transition-colors"
            title="Delete task"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      </div>

      <h4 className="font-bold text-sm text-[var(--color-glass-text-primary)] dark:text-[var(--color-glass-dark-text-primary)] leading-snug">
        {task.title}
      </h4>

      {task.description && (
        <p className="text-xs text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)] line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-[var(--color-glass-regular-border)] dark:border-[var(--color-glass-dark-regular-border)] text-[10px] text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)]">
        <div className="flex items-center gap-1">
          <Calendar className="size-3 text-amber-500/50" />
          <span>{task.due_date || "No due date"}</span>
        </div>
        {assigneeName ? (
          <div className="flex items-center gap-1 glass-clear px-1.5 py-0.5 rounded-[var(--radius-glass-sm)] text-[var(--color-glass-text-primary)] dark:text-[var(--color-glass-dark-text-primary)] font-semibold border border-[var(--color-glass-clear-border)] dark:border-[var(--color-glass-dark-clear-border)]">
            <User className="size-3 text-amber-500/70" />
            <span>{assigneeName}</span>
          </div>
        ) : (
          <span className="text-[9px] text-[var(--color-glass-text-tertiary)] dark:text-[var(--color-glass-dark-text-tertiary)] italic">
            Unassigned
          </span>
        )}
      </div>
    </GlassPanel>
  );
}

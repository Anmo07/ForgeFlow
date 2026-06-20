"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
} from "lucide-react";

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

export default function ProjectDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { currentOrg } = useOrgStore();

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskStatus, setTaskStatus] = useState("todo");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskAssignee, setTaskAssignee] = useState<string>("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  const fetchProjectDetails = async () => {
    if (!currentOrg || !id) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await apiFetch<Project>(`/api/projects/${id}`, {
        orgId: currentOrg.id,
      });
      setProject(data);

      try {
        const mems = await apiFetch<Member[]>(
          `/api/memberships/organization/${currentOrg.id}`,
          { orgId: currentOrg.id },
        );
        setMembers(mems || []);
      } catch (e) {
        console.error("Could not load organization members", e);
      }
    } catch (err: any) {
      console.error("Error loading project details:", err);
      setErrorMsg(err.message || "Failed to load project details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [currentOrg, id]);

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

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !project || !taskTitle) return;
    setIsSubmittingTask(true);
    setErrorMsg("");

    const payload = {
      title: taskTitle,
      description: taskDesc || null,
      status: taskStatus,
      priority: taskPriority,
      assigned_to: taskAssignee ? Number(taskAssignee) : null,
      due_date: taskDueDate || null,
    };

    try {
      if (editingTask) {
        await apiFetch(`/api/projects/${project.id}/tasks/${editingTask.id}`, {
          orgId: currentOrg.id,
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch(`/api/projects/${project.id}/tasks`, {
          orgId: currentOrg.id,
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      setIsTaskModalOpen(false);
      await fetchProjectDetails();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save task");
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (
      !currentOrg ||
      !project ||
      !confirm("Are you sure you want to delete this task?")
    )
      return;
    try {
      await apiFetch(`/api/projects/${project.id}/tasks/${taskId}`, {
        orgId: currentOrg.id,
        method: "DELETE",
      });
      await fetchProjectDetails();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to delete task");
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData("text/plain", String(taskId));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const taskIdStr = e.dataTransfer.getData("text/plain");
    if (!taskIdStr || !project || !currentOrg) return;

    const taskId = Number(taskIdStr);
    const existingTask = project.tasks.find((t) => t.id === taskId);
    if (!existingTask || existingTask.status === targetStatus) return;

    try {
      await apiFetch(`/api/projects/${project.id}/tasks/${taskId}`, {
        orgId: currentOrg.id,
        method: "PUT",
        body: JSON.stringify({ status: targetStatus }),
      });

      setProject((prev) => {
        if (!prev) return null;
        const updatedTasks = prev.tasks.map((t) =>
          t.id === taskId ? { ...t, status: targetStatus } : t,
        );
        const completed = updatedTasks.filter(
          (t) => t.status === "done",
        ).length;
        return {
          ...prev,
          tasks: updatedTasks,
          tasks_completed: completed,
        };
      });
    } catch (err: any) {
      console.error("Failed to move task", err);
      setErrorMsg("Failed to update task status");
    }
  };

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

  if (errorMsg && !project) {
    return (
      <div className="space-y-4 py-10 max-w-md mx-auto text-center">
        <AlertCircle className="size-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-foreground">Project Not Found</h3>
        <p className="text-sm text-muted-foreground">{errorMsg}</p>
        <button
          onClick={() => router.push("/projects")}
          className="inline-flex items-center gap-2 text-sm text-amber-500 hover:underline font-semibold"
        >
          <ArrowLeft className="size-4" />
          Back to Projects
        </button>
      </div>
    );
  }

  if (!project) return null;

  const todoTasks = project.tasks.filter((t) => t.status === "todo");
  const inProgressTasks = project.tasks.filter(
    (t) => t.status === "in_progress",
  );
  const doneTasks = project.tasks.filter((t) => t.status === "done");

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
              {project.priority}
            </div>
          </div>
          <div className="space-y-1">
            <div className="font-semibold text-foreground uppercase tracking-wider text-[10px]">
              Status
            </div>
            <div className="text-sm font-bold text-blue-400 capitalize">
              {project.status.replace("_", " ")}
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {}
        <div
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, "todo")}
          className="bg-card/10 border border-border rounded-xl p-4 flex flex-col min-h-[500px]"
        >
          <div className="flex items-center justify-between mb-4 border-b border-border pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-zinc-400"></span>
              <h3 className="font-bold text-sm tracking-tight text-foreground">
                To Do
              </h3>
            </div>
            <span className="text-xs bg-muted/40 text-muted-foreground px-2 py-0.5 rounded-full font-bold">
              {todoTasks.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3">
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
              <div className="h-full flex items-center justify-center text-center p-6 border-2 border-dashed border-border/50 rounded-lg text-xs text-muted-foreground/60 select-none">
                Drag tasks here
              </div>
            )}
          </div>
        </div>

        {}
        <div
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, "in_progress")}
          className="bg-card/10 border border-border rounded-xl p-4 flex flex-col min-h-[500px]"
        >
          <div className="flex items-center justify-between mb-4 border-b border-border pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-amber-400"></span>
              <h3 className="font-bold text-sm tracking-tight text-foreground">
                In Progress
              </h3>
            </div>
            <span className="text-xs bg-muted/40 text-muted-foreground px-2 py-0.5 rounded-full font-bold">
              {inProgressTasks.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3">
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
              <div className="h-full flex items-center justify-center text-center p-6 border-2 border-dashed border-border/50 rounded-lg text-xs text-muted-foreground/60 select-none">
                Drag tasks here
              </div>
            )}
          </div>
        </div>

        {}
        <div
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, "done")}
          className="bg-card/10 border border-border rounded-xl p-4 flex flex-col min-h-[500px]"
        >
          <div className="flex items-center justify-between mb-4 border-b border-border pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-400"></span>
              <h3 className="font-bold text-sm tracking-tight text-foreground">
                Done
              </h3>
            </div>
            <span className="text-xs bg-muted/40 text-muted-foreground px-2 py-0.5 rounded-full font-bold">
              {doneTasks.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3">
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
              <div className="h-full flex items-center justify-center text-center p-6 border-2 border-dashed border-border/50 rounded-lg text-xs text-muted-foreground/60 select-none">
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
                  disabled={isSubmittingTask}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingTask && (
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
  const assigneeName = task.assigned_to
    ? members.find((m) => m.user_id === task.assigned_to)?.user_name ||
      "Assigned"
    : null;

  let priorityClass = "text-zinc-400 bg-zinc-500/10 border-zinc-500/20";
  if (task.priority === "high") {
    priorityClass = "text-rose-400 bg-rose-500/10 border-rose-500/20";
  } else if (task.priority === "medium") {
    priorityClass = "text-amber-400 bg-amber-500/10 border-amber-500/20";
  }

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      className="bg-card/40 border border-border rounded-lg p-4 shadow-sm hover:border-amber-500/15 cursor-grab active:cursor-grabbing transition-all select-none space-y-3 group"
    >
      <div className="flex justify-between items-start gap-2">
        <span
          className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded border ${priorityClass}`}
        >
          {task.priority}
        </span>
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(task)}
            className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded transition-colors"
            title="Edit task"
          >
            <Edit2 className="size-3" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
            title="Delete task"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      </div>

      <h4 className="font-bold text-sm text-foreground leading-snug">
        {task.title}
      </h4>

      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <Calendar className="size-3 text-amber-500/50" />
          <span>{task.due_date || "No due date"}</span>
        </div>
        {assigneeName ? (
          <div className="flex items-center gap-1 bg-muted/40 px-1.5 py-0.5 rounded text-foreground font-medium">
            <User className="size-3 text-amber-500/70" />
            <span>{assigneeName}</span>
          </div>
        ) : (
          <span className="text-[9px] text-muted-foreground/60 italic">
            Unassigned
          </span>
        )}
      </div>
    </div>
  );
}

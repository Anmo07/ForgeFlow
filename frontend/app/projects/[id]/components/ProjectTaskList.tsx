"use client";

import React from "react";
import { Plus, CheckCircle2, Clock, Trash2 } from "lucide-react";
import { GlassPanel } from "@/components/glass/GlassPanel";
import type { Task } from "@/types";

interface ProjectTaskListProps {
  tasks: Task[];
  onOpenModal: () => void;
  onStatusChange: (taskId: number, newStatus: Task['status']) => void;
  onDeleteTask: (taskId: number) => void;
}

const KANBAN_STAGES: { id: Task['status']; label: string }[] = [
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "review", label: "In Review" },
  { id: "done", label: "Done" },
];

export function ProjectTaskList({
  tasks,
  onOpenModal,
  onStatusChange,
  onDeleteTask,
}: ProjectTaskListProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-semibold text-[var(--color-glass-text-primary)]">
          Kanban Board
        </h3>
        <button
          onClick={onOpenModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          <Plus className="size-4" />
          <span>Add Task</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {KANBAN_STAGES.map((stage) => {
          const stageTasks = tasks.filter((t) => t.status === stage.id);

          return (
            <GlassPanel key={stage.id} intensity="clear" className="p-4 flex flex-col min-h-[350px]">
              <div className="mb-3 border-b border-white/10 pb-2 flex justify-between items-center">
                <h4 className="text-xs font-bold uppercase text-[var(--color-glass-text-primary)]">
                  {stage.label}
                </h4>
                <span className="text-xs text-[var(--color-glass-text-secondary)] font-semibold">
                  {stageTasks.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {stageTasks.map((task) => (
                  <GlassPanel key={task.id} intensity="regular" className="p-3 hover:border-primary/50 transition-colors group">
                    <div className="flex justify-between items-start mb-1">
                      <h5 className="font-medium text-xs text-[var(--color-glass-text-primary)]">
                        {task.title}
                      </h5>
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-[var(--color-glass-text-secondary)] hover:text-red-400 transition-all"
                        title="Delete task"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>

                    {task.description && (
                      <p className="text-[11px] text-[var(--color-glass-text-secondary)] mb-2 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                      <select
                        value={task.status}
                        onChange={(e) => onStatusChange(task.id, e.target.value as Task['status'])}
                        className="px-2 py-0.5 bg-white/10 border border-white/10 rounded text-[10px] text-[var(--color-glass-text-primary)] focus:outline-none"
                      >
                        <option value="todo" className="bg-slate-900">To Do</option>
                        <option value="in_progress" className="bg-slate-900">In Progress</option>
                        <option value="review" className="bg-slate-900">Review</option>
                        <option value="done" className="bg-slate-900">Done</option>
                      </select>

                      <span
                        className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                          task.priority === "critical" || task.priority === "high"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-blue-500/20 text-blue-400"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  </GlassPanel>
                ))}
              </div>
            </GlassPanel>
          );
        })}
      </div>
    </div>
  );
}

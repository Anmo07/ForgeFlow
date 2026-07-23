"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, Folder } from "lucide-react";
import { GlassPanel } from "@/components/glass/GlassPanel";
import type { Project } from "@/types";

interface ProjectHeaderProps {
  project: Project;
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const total = project.total_tasks || project.tasks?.length || 0;
  const completed = project.tasks_completed || project.tasks?.filter((t) => t.status === "done").length || 0;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-4">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-xs text-[var(--color-glass-text-secondary)] hover:text-[var(--color-glass-text-primary)] transition-colors"
      >
        <ArrowLeft className="size-4" />
        <span>Back to Projects</span>
      </Link>

      <GlassPanel intensity="regular" className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold">
                <Folder className="size-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--color-glass-text-primary)]">
                  {project.name}
                </h1>
                <p className="text-xs text-[var(--color-glass-text-secondary)]">
                  {project.description || "No description provided."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
            <div>
              <div className="text-xs text-[var(--color-glass-text-secondary)] uppercase">Progress</div>
              <div className="text-lg font-bold text-primary">{percent}%</div>
            </div>
            <div>
              <div className="text-xs text-[var(--color-glass-text-secondary)] uppercase">Tasks</div>
              <div className="text-lg font-bold text-[var(--color-glass-text-primary)]">
                {completed} / {total}
              </div>
            </div>
            {project.due_date && (
              <div className="text-xs text-[var(--color-glass-text-secondary)] flex items-center gap-1">
                <Calendar className="size-3.5" />
                <span>{project.due_date}</span>
              </div>
            )}
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}

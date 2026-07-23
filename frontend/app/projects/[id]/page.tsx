"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useOrg } from "@/hooks/use-org";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { isApiError } from "@/lib/errors";
import { ProjectHeader } from "./components/ProjectHeader";
import { ProjectTaskList } from "./components/ProjectTaskList";
import type { Project, Task } from "@/types";
import toast from "react-hot-toast";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = String(params?.id || "1");
  const { orgId, isOrgLoaded } = useOrg();
  const queryClient = useQueryClient();

  const [newTaskTitle, setNewTaskTitle] = useState("");

  const projectQuery = useQuery({
    queryKey: queryKeys.project(orgId, projectId),
    queryFn: async (): Promise<Project> => {
      return apiFetch<Project>(`/api/projects/${projectId}`);
    },
    enabled: isOrgLoaded && !!projectId,
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number; status: Task['status'] }) => {
      return apiFetch<Task>(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      toast.success("Task updated");
    },
    onError: (err) => {
      toast.error(isApiError(err) ? err.displayMessage : "Failed to update task");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.project(orgId, projectId) });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: number) => {
      return apiFetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast.success("Task deleted");
    },
    onError: (err) => {
      toast.error(isApiError(err) ? err.displayMessage : "Failed to delete task");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.project(orgId, projectId) });
    },
  });

  const createTask = useMutation({
    mutationFn: async (title: string) => {
      return apiFetch<Task>(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        body: JSON.stringify({ title, status: "todo", priority: "medium" }),
      });
    },
    onSuccess: () => {
      toast.success("Task created");
      setNewTaskTitle("");
    },
    onError: (err) => {
      toast.error(isApiError(err) ? err.displayMessage : "Failed to create task");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.project(orgId, projectId) });
    },
  });

  const project = projectQuery.data;

  if (projectQuery.isLoading || !project) {
    return (
      <div className="p-8 text-center text-[var(--color-glass-text-secondary)] animate-pulse">
        Loading project details...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProjectHeader project={project} />

      <ProjectTaskList
        tasks={project.tasks || []}
        onOpenModal={() => {
          const title = prompt("Enter task title:");
          if (title?.trim()) {
            createTask.mutate(title.trim());
          }
        }}
        onStatusChange={(taskId, status) => updateTaskStatus.mutate({ taskId, status })}
        onDeleteTask={(taskId) => deleteTask.mutate(taskId)}
      />
    </div>
  );
}

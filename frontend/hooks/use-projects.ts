import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { useOrg } from '@/hooks/use-org';
import { apiFetch } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import type { Project, CreateProjectPayload } from '@/types';
import toast from 'react-hot-toast';

export function useProjects() {
  const { orgId, isOrgLoaded } = useOrg();
  const queryClient = useQueryClient();

  const projectsQuery = useQuery({
    queryKey: queryKeys.projects(orgId),
    queryFn: async (): Promise<Project[]> => {
      const res = await apiFetch<Project[] | { items: Project[] }>('/api/projects');
      return Array.isArray(res) ? res : res?.items ?? [];
    },
    enabled: isOrgLoaded,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const createProject = useMutation({
    mutationFn: (payload: CreateProjectPayload) =>
      apiFetch<Project>('/api/projects', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onMutate: async (newProject) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.projects(orgId) });
      const previous = queryClient.getQueryData<Project[]>(queryKeys.projects(orgId));
      
      const tempProject: Project = {
        id: Date.now(),
        organization_id: Number(orgId),
        name: newProject.name,
        description: newProject.description || '',
        status: newProject.status || 'planning',
        priority: newProject.priority || 'medium',
        due_date: newProject.due_date || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_tasks: 0,
        tasks_completed: 0,
        tasks: [],
      };

      queryClient.setQueryData<Project[]>(queryKeys.projects(orgId), (old) => [
        ...(old ?? []),
        tempProject,
      ]);
      return { previous };
    },
    onError: (error, _vars, ctx: { previous?: Project[] } | undefined) => {
      if (ctx?.previous) {
        queryClient.setQueryData(queryKeys.projects(orgId), ctx.previous);
      }
      toast.error(isApiError(error) ? error.displayMessage : 'Failed to create project.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects(orgId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(orgId) });
    },
  });

  return {
    projects: projectsQuery.data ?? [],
    isLoading: projectsQuery.isLoading,
    isError: projectsQuery.isError,
    error: projectsQuery.error,
    refetch: projectsQuery.refetch,
    createProject,
  };
}

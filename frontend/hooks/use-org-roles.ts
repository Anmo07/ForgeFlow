import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { useOrg } from '@/hooks/use-org';
import { apiFetch } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import type { Role, Permission } from '@/types';
import toast from 'react-hot-toast';

export function useOrgRoles() {
  const { orgId, isOrgLoaded } = useOrg();
  const queryClient = useQueryClient();

  const rolesQuery = useQuery({
    queryKey: queryKeys.orgRoles(orgId),
    queryFn: async (): Promise<Role[]> => {
      const res = await apiFetch<Role[] | { items: Role[] }>(`/api/roles/organization/${orgId}`);
      return Array.isArray(res) ? res : res?.items ?? [];
    },
    enabled: isOrgLoaded,
    staleTime: 30_000,
  });

  const permissionsQuery = useQuery({
    queryKey: queryKeys.orgPermissions(),
    queryFn: async (): Promise<Permission[]> => {
      const res = await apiFetch<Permission[] | { items: Permission[] }>('/api/permissions');
      return Array.isArray(res) ? res : res?.items ?? [];
    },
    staleTime: 300_000,
  });

  const createRole = useMutation({
    mutationFn: (payload: { name: string; description?: string; permission_ids: number[]; organization_id?: number }) =>
      apiFetch<Role>('/api/roles/', {
        method: 'POST',
        body: JSON.stringify({ ...payload, organization_id: payload.organization_id || Number(orgId) }),
      }),
    onSuccess: () => {
      toast.success('Custom role created successfully');
    },
    onError: (error) => {
      toast.error(isApiError(error) ? error.displayMessage : 'Failed to create role.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orgRoles(orgId) });
    },
  });

  return {
    roles: rolesQuery.data ?? [],
    permissions: permissionsQuery.data ?? [],
    isLoading: rolesQuery.isLoading,
    isError: rolesQuery.isError,
    error: rolesQuery.error,
    refetch: rolesQuery.refetch,
    createRole,
  };
}

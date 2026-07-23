import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { useOrg } from '@/hooks/use-org';
import { apiFetch } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import type { Membership } from '@/types';
import toast from 'react-hot-toast';

export function useOrgMembers() {
  const { orgId, isOrgLoaded } = useOrg();
  const queryClient = useQueryClient();

  const membersQuery = useQuery({
    queryKey: queryKeys.orgMembers(orgId),
    queryFn: async (): Promise<Membership[]> => {
      const res = await apiFetch<Membership[] | { items: Membership[] }>(
        `/api/memberships/organization/${orgId}`
      );
      return Array.isArray(res) ? res : res?.items ?? [];
    },
    enabled: isOrgLoaded,
    staleTime: 30_000,
  });

  const inviteMember = useMutation({
    mutationFn: (payload: { email: string; role_id: number; organization_id?: number }) =>
      apiFetch<Membership>('/api/memberships/invite', {
        method: 'POST',
        body: JSON.stringify({ ...payload, organization_id: payload.organization_id || Number(orgId) }),
      }),
    onSuccess: () => {
      toast.success('Invitation sent successfully');
    },
    onError: (error) => {
      toast.error(isApiError(error) ? error.displayMessage : 'Failed to send invitation.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orgMembers(orgId) });
    },
  });

  return {
    members: membersQuery.data ?? [],
    isLoading: membersQuery.isLoading,
    isError: membersQuery.isError,
    error: membersQuery.error,
    refetch: membersQuery.refetch,
    inviteMember,
  };
}

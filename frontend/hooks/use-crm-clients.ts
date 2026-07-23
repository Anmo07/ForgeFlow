import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { useOrg } from '@/hooks/use-org';
import { apiFetch } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import type { CRMClient, CreateClientPayload } from '@/types';
import toast from 'react-hot-toast';

export function useCRMClients() {
  const { orgId, isOrgLoaded } = useOrg();
  const queryClient = useQueryClient();

  const clientsQuery = useQuery({
    queryKey: queryKeys.crmClients(orgId),
    queryFn: async (): Promise<CRMClient[]> => {
      const res = await apiFetch<CRMClient[] | { items: CRMClient[] }>('/api/crm/clients');
      return Array.isArray(res) ? res : res?.items ?? [];
    },
    enabled: isOrgLoaded,
    staleTime: 30_000,
  });

  const createClient = useMutation({
    mutationFn: (payload: CreateClientPayload) =>
      apiFetch<CRMClient>('/api/crm/clients', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onMutate: async (newClient) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.crmClients(orgId) });
      const previous = queryClient.getQueryData<CRMClient[]>(queryKeys.crmClients(orgId));

      const tempClient: CRMClient = {
        id: Date.now(),
        organization_id: Number(orgId),
        name: newClient.name,
        email: newClient.email || null,
        phone: newClient.phone || null,
        company: newClient.company || null,
        status: 'active',
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData<CRMClient[]>(queryKeys.crmClients(orgId), (old) => [
        ...(old ?? []),
        tempClient,
      ]);
      return { previous };
    },
    onError: (error, _vars, ctx: { previous?: CRMClient[] } | undefined) => {
      if (ctx?.previous) {
        queryClient.setQueryData(queryKeys.crmClients(orgId), ctx.previous);
      }
      toast.error(isApiError(error) ? error.displayMessage : 'Failed to create client.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.crmClients(orgId) });
    },
  });

  return {
    clients: clientsQuery.data ?? [],
    isLoading: clientsQuery.isLoading,
    isError: clientsQuery.isError,
    error: clientsQuery.error,
    refetch: clientsQuery.refetch,
    createClient,
  };
}

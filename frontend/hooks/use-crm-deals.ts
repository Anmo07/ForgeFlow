import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { useOrg } from '@/hooks/use-org';
import { apiFetch } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import type { Deal, CreateDealPayload } from '@/types';
import toast from 'react-hot-toast';

export function useCRMDeals() {
  const { orgId, isOrgLoaded } = useOrg();
  const queryClient = useQueryClient();

  const dealsQuery = useQuery({
    queryKey: queryKeys.crmDeals(orgId),
    queryFn: async (): Promise<Deal[]> => {
      const res = await apiFetch<Deal[] | { items: Deal[] }>('/api/crm/deals');
      return Array.isArray(res) ? res : res?.items ?? [];
    },
    enabled: isOrgLoaded,
    staleTime: 30_000,
  });

  const createDeal = useMutation({
    mutationFn: (payload: CreateDealPayload) =>
      apiFetch<Deal>('/api/crm/deals', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onMutate: async (newDeal) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.crmDeals(orgId) });
      const previous = queryClient.getQueryData<Deal[]>(queryKeys.crmDeals(orgId));

      const tempDeal: Deal = {
        id: Date.now(),
        organization_id: Number(orgId),
        lead_id: newDeal.lead_id,
        name: newDeal.name,
        value: newDeal.value,
        status: newDeal.status || 'discovery',
        stage: newDeal.stage || 'discovery',
        win_probability: newDeal.win_probability || 50,
        assigned_to: newDeal.assigned_to || null,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData<Deal[]>(queryKeys.crmDeals(orgId), (old) => [
        ...(old ?? []),
        tempDeal,
      ]);
      return { previous };
    },
    onError: (error, _vars, ctx: { previous?: Deal[] } | undefined) => {
      if (ctx?.previous) {
        queryClient.setQueryData(queryKeys.crmDeals(orgId), ctx.previous);
      }
      toast.error(isApiError(error) ? error.displayMessage : 'Failed to create deal.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.crmDeals(orgId) });
    },
  });

  return {
    deals: dealsQuery.data ?? [],
    isLoading: dealsQuery.isLoading,
    isError: dealsQuery.isError,
    error: dealsQuery.error,
    refetch: dealsQuery.refetch,
    createDeal,
  };
}

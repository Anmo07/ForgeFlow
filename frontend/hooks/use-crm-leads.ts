import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { useOrg } from '@/hooks/use-org';
import { apiFetch } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import type { Lead, CreateLeadPayload } from '@/types';
import toast from 'react-hot-toast';

export function useCRMLeads() {
  const { orgId, isOrgLoaded } = useOrg();
  const queryClient = useQueryClient();

  const leadsQuery = useQuery({
    queryKey: queryKeys.crmLeads(orgId),
    queryFn: async (): Promise<Lead[]> => {
      const res = await apiFetch<Lead[] | { items: Lead[] }>('/api/crm/leads');
      return Array.isArray(res) ? res : res?.items ?? [];
    },
    enabled: isOrgLoaded,
    staleTime: 30_000,
  });

  const createLead = useMutation({
    mutationFn: (payload: CreateLeadPayload) =>
      apiFetch<Lead>('/api/crm/leads', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onMutate: async (newLead) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.crmLeads(orgId) });
      const previous = queryClient.getQueryData<Lead[]>(queryKeys.crmLeads(orgId));

      const tempLead: Lead = {
        id: Date.now(),
        organization_id: Number(orgId),
        client_id: newLead.client_id,
        status: newLead.status || 'new',
        value: newLead.value || 0,
        source: newLead.source || 'website',
        assigned_to: newLead.assigned_to || null,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData<Lead[]>(queryKeys.crmLeads(orgId), (old) => [
        ...(old ?? []),
        tempLead,
      ]);
      return { previous };
    },
    onError: (error, _vars, ctx: { previous?: Lead[] } | undefined) => {
      if (ctx?.previous) {
        queryClient.setQueryData(queryKeys.crmLeads(orgId), ctx.previous);
      }
      toast.error(isApiError(error) ? error.displayMessage : 'Failed to create lead.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.crmLeads(orgId) });
    },
  });

  const updateLeadStatus = useMutation({
    mutationFn: ({ leadId, status, value }: { leadId: number; status?: Lead['status']; value?: number }) =>
      apiFetch<Lead>(`/api/crm/leads/${leadId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, value }),
      }),
    onMutate: async ({ leadId, status, value }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.crmLeads(orgId) });
      const previous = queryClient.getQueryData<Lead[]>(queryKeys.crmLeads(orgId));

      queryClient.setQueryData<Lead[]>(queryKeys.crmLeads(orgId), (old) =>
        (old ?? []).map((lead) =>
          lead.id === leadId
            ? { ...lead, ...(status ? { status } : {}), ...(value !== undefined ? { value } : {}) }
            : lead
        )
      );
      return { previous };
    },
    onError: (error, _vars, ctx: { previous?: Lead[] } | undefined) => {
      if (ctx?.previous) {
        queryClient.setQueryData(queryKeys.crmLeads(orgId), ctx.previous);
      }
      toast.error(isApiError(error) ? error.displayMessage : 'Failed to update lead.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.crmLeads(orgId) });
    },
  });

  return {
    leads: leadsQuery.data ?? [],
    isLoading: leadsQuery.isLoading,
    isError: leadsQuery.isError,
    error: leadsQuery.error,
    refetch: leadsQuery.refetch,
    createLead,
    updateLeadStatus,
  };
}

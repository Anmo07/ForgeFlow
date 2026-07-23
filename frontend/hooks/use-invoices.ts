import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { useOrg } from '@/hooks/use-org';
import { apiFetch } from '@/lib/api';
import { isApiError } from '@/lib/errors';
import type { Invoice, CreateInvoicePayload } from '@/types';
import toast from 'react-hot-toast';

export function useInvoices() {
  const { orgId, isOrgLoaded } = useOrg();
  const queryClient = useQueryClient();

  const invoicesQuery = useQuery({
    queryKey: queryKeys.invoices(orgId),
    queryFn: async (): Promise<Invoice[]> => {
      const res = await apiFetch<Invoice[] | { items: Invoice[] }>('/api/invoices');
      return Array.isArray(res) ? res : res?.items ?? [];
    },
    enabled: isOrgLoaded,
    staleTime: 30_000,
  });

  const createInvoice = useMutation({
    mutationFn: (payload: CreateInvoicePayload) =>
      apiFetch<Invoice>('/api/invoices', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onMutate: async (newInv) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.invoices(orgId) });
      const previous = queryClient.getQueryData<Invoice[]>(queryKeys.invoices(orgId));

      const tempInvoice: Invoice = {
        id: Date.now(),
        organization_id: Number(orgId),
        client_id: newInv.client_id,
        invoice_number: `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        status: 'sent',
        subtotal: newInv.subtotal || 0,
        tax_rate: newInv.tax_rate || 0,
        tax_amount: newInv.tax_amount || 0,
        total: newInv.total || 0,
        issue_date: newInv.issue_date,
        due_date: newInv.due_date,
        notes: newInv.notes || '',
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData<Invoice[]>(queryKeys.invoices(orgId), (old) => [
        ...(old ?? []),
        tempInvoice,
      ]);
      return { previous };
    },
    onError: (error, _vars, ctx: { previous?: Invoice[] } | undefined) => {
      if (ctx?.previous) {
        queryClient.setQueryData(queryKeys.invoices(orgId), ctx.previous);
      }
      toast.error(isApiError(error) ? error.displayMessage : 'Failed to create invoice.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices(orgId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoiceMetrics(orgId) });
    },
  });

  return {
    invoices: invoicesQuery.data ?? [],
    isLoading: invoicesQuery.isLoading,
    isError: invoicesQuery.isError,
    error: invoicesQuery.error,
    refetch: invoicesQuery.refetch,
    createInvoice,
  };
}

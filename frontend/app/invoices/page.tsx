"use client";

import React, { useEffect, useState } from "react";
import {
  FileText,
  Plus,
  Search,
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  Eye,
  Building,
  Loader2,
  AlertCircle,
  X,
  Trash2,
} from "lucide-react";
import { useOrgStore } from "@/store/organization";
import { useAuthStore } from "@/store/auth";
import { apiFetch } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GlassPanel } from "@/components/glass/GlassPanel";

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
}

interface InvoiceLineItem {
  id: number;
  invoice_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface Invoice {
  id: number;
  organization_id: number;
  client_id: number | null;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes: string | null;
  pdf_url: string | null;
  client_name: string | null;
  line_items: InvoiceLineItem[];
}

interface InvoiceMetrics {
  total_billed: number;
  total_collected: number;
  total_outstanding: number;
  total_overdue: number;
  invoice_count: number;
}

interface Client {
  id: number;
  name: string;
  company: string | null;
}

export default function InvoicesPage() {
  const { currentOrg } = useOrgStore();

  const queryClient = useQueryClient();

  const { data: qInvoices, isFetching: isFetchingInvoices, isLoading: isLoadingInvoices } = useQuery<Invoice[]>({
    queryKey: ["invoices", currentOrg?.id],
    queryFn: () => apiFetch<Invoice[]>("/api/invoices", { orgId: currentOrg?.id }),
    enabled: !!currentOrg?.id,
  });

  const { data: qMetrics, isFetching: isFetchingMetrics, isLoading: isLoadingMetrics } = useQuery<InvoiceMetrics>({
    queryKey: ["invoiceMetrics", currentOrg?.id],
    queryFn: () => apiFetch<InvoiceMetrics>("/api/invoices/metrics", { orgId: currentOrg?.id }),
    enabled: !!currentOrg?.id,
  });

  const { data: qClients, isFetching: isFetchingClients, isLoading: isLoadingClients } = useQuery<Client[]>({
    queryKey: ["crmClients", currentOrg?.id],
    queryFn: () => apiFetch<Client[]>("/api/crm/clients", { orgId: currentOrg?.id }),
    enabled: !!currentOrg?.id,
  });

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [metrics, setMetrics] = useState<InvoiceMetrics>({
    total_billed: 0,
    total_collected: 0,
    total_outstanding: 0,
    total_overdue: 0,
    invoice_count: 0,
  });
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    if (qInvoices) setInvoices(qInvoices);
  }, [qInvoices]);

  useEffect(() => {
    if (qMetrics) setMetrics(qMetrics);
  }, [qMetrics]);

  useEffect(() => {
    if (qClients) setClients(qClients);
  }, [qClients]);

  const loading = isLoadingInvoices || isLoadingMetrics || isLoadingClients;
  const isRefreshing = isFetchingInvoices || isFetchingMetrics || isFetchingClients;
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [errorMsg, setErrorMsg] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClientId, setNewClientId] = useState("");
  const [newIssueDate, setNewIssueDate] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newTaxRate, setNewTaxRate] = useState("0");
  const [newNotes, setNewNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unit_price: 0 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const loadInvoiceData = async () => {
    if (!currentOrg) return;
    setErrorMsg("");
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["invoices", currentOrg.id] }),
        queryClient.invalidateQueries({ queryKey: ["invoiceMetrics", currentOrg.id] }),
        queryClient.invalidateQueries({ queryKey: ["crmClients", currentOrg.id] }),
      ]);
    } catch (err: unknown) {
      console.error("Error invalidating queries:", err);
      setErrorMsg(err instanceof Error ? err.message : "Failed to load invoices");
    }
  };

  useEffect(() => {
    if (currentOrg) {
      loadInvoiceData();
    }
    window.addEventListener("orgChanged", loadInvoiceData);
    return () => window.removeEventListener("orgChanged", loadInvoiceData);
  }, [currentOrg]);

  const handleAddLineItem = () => {
    setLineItems([
      ...lineItems,
      { description: "", quantity: 1, unit_price: 0 },
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (
    index: number,
    field: keyof LineItem,
    value: string | number,
  ) => {
    const updated = [...lineItems];
    if (field === "description") {
      updated[index][field] = String(value);
    } else {
      updated[index][field] = Number(value);
    }
    setLineItems(updated);
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !newIssueDate || !newDueDate) return;

    const invalidItem = lineItems.find(
      (item) => !item.description || item.quantity <= 0 || item.unit_price < 0,
    );
    if (invalidItem) {
      setErrorMsg("Please fill in all line item details correctly.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const createdInvoice = await apiFetch<any>("/api/invoices", {
        orgId: currentOrg.id,
        method: "POST",
        body: JSON.stringify({
          client_id: newClientId ? Number(newClientId) : null,
          issue_date: newIssueDate,
          due_date: newDueDate,
          tax_rate: Number(newTaxRate),
          notes: newNotes || null,
          line_items: lineItems,
        }),
      });

      setIsModalOpen(false);
      setNewClientId("");
      setNewIssueDate("");
      setNewDueDate("");
      setNewTaxRate("0");
      setNewNotes("");
      setLineItems([{ description: "", quantity: 1, unit_price: 0 }]);

      await loadInvoiceData();

      if (createdInvoice && createdInvoice.id) {
        window.open(`/api/invoices/${createdInvoice.id}/pdf`, "_blank");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to create invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (invoiceId: number, nextStatus: string) => {
    if (!currentOrg) return;
    try {
      await apiFetch(`/api/invoices/${invoiceId}/status`, {
        orgId: currentOrg.id,
        method: "PUT",
        body: JSON.stringify({ status: nextStatus }),
      });
      await loadInvoiceData();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg("Failed to update invoice status");
    }
  };

  const handleDownloadPdf = async (
    invoiceId: number,
    invoiceNumber: string,
  ) => {
    if (!currentOrg) return;
    try {
      const pdfWindow = window.open(`/api/invoices/${invoiceId}/pdf`, "_blank");
      if (!pdfWindow) {
        window.location.href = `/api/invoices/${invoiceId}/pdf`;
      }
    } catch (err) {
      console.error("PDF open failed", err);
      alert("Could not open PDF invoice window.");
    }
  };

  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0,
  );
  const taxAmount = subtotal * (Number(newTaxRate) / 100);
  const total = subtotal + taxAmount;

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.client_name &&
        invoice.client_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus =
      statusFilter === "All" ||
      invoice.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  if (!currentOrg) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FileText className="size-16 text-muted-foreground/50 mb-4 animate-pulse" />
        <h3 className="text-xl font-bold tracking-tight">
          Select an organization
        </h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          Please select or create an organization from the workspace switcher in
          the header to view invoices.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Billing & Invoices
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-muted-foreground text-sm">
              Issue, track and verify payments seamlessly.
            </p>
            {isRefreshing && !loading && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded animate-pulse">
                <Loader2 className="size-2.5 animate-spin" />
                Refreshing...
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary hover:opacity-90 text-primary-foreground px-4 py-2.5 text-sm font-semibold shadow transition-colors"
        >
          <Plus className="size-4 stroke-[2.5]" />
          Create Invoice
        </button>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Billed */}
        <GlassPanel
          variant="regular"
          radius="xl"
          className="p-5 shadow-[var(--shadow-glass-sm)] dark:shadow-[var(--shadow-glass-dark-sm)] border border-[var(--color-glass-regular-border)] dark:border-[var(--color-glass-dark-regular-border)]"
        >
          <div className="flex justify-between items-center text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)] mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">
              Total Billed
            </span>
            <DollarSign className="size-4 text-blue-500" />
          </div>
          <div className="text-3xl font-extrabold text-[var(--color-glass-text-primary)] dark:text-[var(--color-glass-dark-text-primary)]">
            $
            {metrics.total_billed.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </div>
          <p className="text-xs text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)] mt-1">
            Total billing value issued
          </p>
        </GlassPanel>

        {/* Collected (Paid) */}
        <GlassPanel
          variant="regular"
          accentGradient="emerald"
          radius="xl"
          className="p-5 shadow-[var(--shadow-glass-sm)] dark:shadow-[var(--shadow-glass-dark-sm)] border border-[var(--color-glass-regular-border)] dark:border-[var(--color-glass-dark-regular-border)] animate-in fade-in zoom-in duration-300"
        >
          <div className="flex justify-between items-center text-emerald-100 dark:text-emerald-200 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">
              Collected
            </span>
            <CheckCircle className="size-4 text-emerald-300 dark:text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">
            $
            {metrics.total_collected.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </div>
          <p className="text-xs text-emerald-100 dark:text-emerald-300 mt-1">
            Paid and settled invoices
          </p>
        </GlassPanel>

        {/* Outstanding (Total Owed) */}
        <GlassPanel
          variant="regular"
          accentGradient="amber"
          radius="xl"
          className="p-5 shadow-[var(--shadow-glass-sm)] dark:shadow-[var(--shadow-glass-dark-sm)] border border-[var(--color-glass-regular-border)] dark:border-[var(--color-glass-dark-regular-border)] animate-in fade-in zoom-in duration-300"
        >
          <div className="flex justify-between items-center text-amber-100 dark:text-amber-200 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">
              Outstanding
            </span>
            <Clock className="size-4 text-amber-300 dark:text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">
            $
            {metrics.total_outstanding.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </div>
          <p className="text-xs text-amber-100 dark:text-amber-300 mt-1">
            Unpaid sent invoices
          </p>
        </GlassPanel>

        {/* Overdue */}
        <GlassPanel
          variant="regular"
          accentGradient="red"
          radius="xl"
          className="p-5 shadow-[var(--shadow-glass-sm)] dark:shadow-[var(--shadow-glass-dark-sm)] border border-[var(--color-glass-regular-border)] dark:border-[var(--color-glass-dark-regular-border)] animate-in fade-in zoom-in duration-300"
        >
          <div className="flex justify-between items-center text-red-100 dark:text-red-200 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">
              Overdue
            </span>
            <AlertTriangle className="size-4 text-red-300 dark:text-red-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">
            $
            {metrics.total_overdue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </div>
          <p className="text-xs text-red-100 dark:text-red-300 mt-1">Past due dates</p>
        </GlassPanel>
      </div>

      {}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card/30 border border-border rounded-xl p-4 shadow-sm backdrop-blur-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search invoice number, client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-background/50 border border-border rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-background/50 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/50"
          >
            <option value="All">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm p-4 rounded-xl flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="size-8 text-primary animate-spin" />
          <span className="text-sm text-muted-foreground mt-2">
            Loading invoicing system...
          </span>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 font-semibold border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-4">Invoice ID</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Issue Date</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-900 dark:text-gray-100">
                {filteredInvoices.map((invoice) => {
                  let badgeColor =
                    "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20";
                  if (invoice.status === "paid")
                    badgeColor =
                      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
                  if (invoice.status === "overdue")
                    badgeColor =
                      "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20";
                  if (invoice.status === "sent")
                    badgeColor =
                      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20";

                  return (
                    <tr
                      key={invoice.id}
                      className="bg-white dark:bg-gray-900 hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono font-bold text-blue-600 dark:text-blue-400 select-all">
                        {invoice.invoice_number}
                      </td>
                      <td className="px-6 py-4 font-semibold">
                        <Building className="size-3.5 inline mr-1.5 text-gray-500 dark:text-gray-400" />
                        {invoice.client_name || "Direct Customer"}
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                        {new Date(invoice.issue_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                        {new Date(invoice.due_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-gray-100">
                        $
                        {invoice.total.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeColor}`}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <select
                            value={invoice.status}
                            onChange={(e) =>
                              handleUpdateStatus(invoice.id, e.target.value)
                            }
                            className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded px-2 py-1 text-xs outline-none text-gray-900 dark:text-gray-100"
                          >
                            <option value="draft">Draft</option>
                            <option value="sent">Sent</option>
                            <option value="paid">Paid</option>
                            <option value="overdue">Overdue</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          <button
                            onClick={() => setSelectedInvoice(invoice)}
                            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                            title="View details"
                          >
                            <Eye className="size-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleDownloadPdf(
                                invoice.id,
                                invoice.invoice_number,
                              )
                            }
                            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                            title="Download PDF"
                          >
                            <Download className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredInvoices.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                    >
                      No invoices matching your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[2px] cursor-pointer"
          />
          <GlassPanel
            variant="heavy"
            radius="xl"
            className="w-full max-w-2xl shadow-[var(--shadow-glass-lg)] dark:shadow-[var(--shadow-glass-dark-lg)] border border-[var(--color-glass-regular-border)] dark:border-[var(--color-glass-dark-regular-border)] flex flex-col max-h-[90vh] z-10 animate-in fade-in zoom-in duration-200"
          >
            <div className="p-5 border-b border-[var(--color-glass-regular-border)] dark:border-[var(--color-glass-dark-regular-border)] flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--color-glass-text-primary)] dark:text-[var(--color-glass-dark-text-primary)]">
                Create Customer Invoice
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)] hover:bg-[var(--color-glass-hover)] dark:hover:bg-[var(--color-glass-dark-hover)] p-1 rounded-lg transition-colors border border-[var(--color-glass-clear-border)] dark:border-[var(--color-glass-dark-clear-border)]"
              >
                <X className="size-5" />
              </button>
            </div>
            <form
              onSubmit={handleCreateInvoice}
              className="p-5 space-y-4 overflow-y-auto flex-1"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Client Organization
                  </label>
                  <select
                    value={newClientId}
                    onChange={(e) => setNewClientId(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/50"
                  >
                    <option value="">
                      Direct Client (No organization link)
                    </option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.company ? `(${c.company})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={newTaxRate}
                    onChange={(e) => setNewTaxRate(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newIssueDate}
                    onChange={(e) => setNewIssueDate(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
              </div>

              {}
              <div className="space-y-2">
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Line Items
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:opacity-80 font-semibold"
                  >
                    <Plus className="size-3" /> Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  {lineItems.map((item, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-2 items-center"
                    >
                      <div className="col-span-6">
                        <input
                          type="text"
                          required
                          value={item.description}
                          onChange={(e) =>
                            handleLineItemChange(
                              index,
                              "description",
                              e.target.value,
                            )
                          }
                          placeholder="Description of product or service..."
                          className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          required
                          min="0.1"
                          step="any"
                          value={item.quantity}
                          onChange={(e) =>
                            handleLineItemChange(
                              index,
                              "quantity",
                              e.target.value,
                            )
                          }
                          placeholder="Qty"
                          className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          required
                          min="0"
                          step="any"
                          value={item.unit_price}
                          onChange={(e) =>
                            handleLineItemChange(
                              index,
                              "unit_price",
                              e.target.value,
                            )
                          }
                          placeholder="Price"
                          className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none"
                        />
                      </div>
                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(index)}
                          disabled={lineItems.length === 1}
                          className="text-muted-foreground hover:text-rose-400 disabled:opacity-30 p-1"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {}
              <div className="bg-muted/10 border border-border rounded-lg p-4 space-y-2 text-sm font-semibold">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>
                    $
                    {subtotal.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span className="text-muted-foreground">
                    Tax ({newTaxRate}%):
                  </span>
                  <span>
                    $
                    {taxAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-base text-primary font-bold">
                  <span>Grand Total:</span>
                  <span>
                    $
                    {total.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Notes / Invoice terms
                </label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Notes, terms, payment details..."
                  rows={2}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none resize-none"
                />
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-border hover:bg-muted text-sm font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary hover:opacity-90 text-primary-foreground font-semibold rounded-lg flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="size-4 animate-spin" />}{" "}
                  Create & Render
                </button>
              </div>
            </form>
          </GlassPanel>
        </div>
      )}

      {}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setSelectedInvoice(null)}
            className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[2px] cursor-pointer"
          />
          <GlassPanel
            variant="heavy"
            radius="xl"
            className="w-full max-w-xl shadow-[var(--shadow-glass-lg)] dark:shadow-[var(--shadow-glass-dark-lg)] border border-[var(--color-glass-regular-border)] dark:border-[var(--color-glass-dark-regular-border)] flex flex-col max-h-[85vh] z-10 animate-in fade-in zoom-in duration-200"
          >
            <div className="p-5 border-b border-[var(--color-glass-regular-border)] dark:border-[var(--color-glass-dark-regular-border)] flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--color-glass-text-primary)] dark:text-[var(--color-glass-dark-text-primary)]">
                Invoice Details: {selectedInvoice.invoice_number}
              </h2>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)] hover:bg-[var(--color-glass-hover)] dark:hover:bg-[var(--color-glass-dark-hover)] p-1 rounded-lg transition-colors border border-[var(--color-glass-clear-border)] dark:border-[var(--color-glass-dark-clear-border)]"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-sm">
              <div className="grid grid-cols-2 gap-4 border-b border-border/40 pb-4">
                <div>
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                    Client
                  </span>
                  <p className="font-bold text-base text-foreground mt-0.5">
                    {selectedInvoice.client_name || "Direct Customer"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                    Status
                  </span>
                  <p className="font-bold capitalize text-primary mt-0.5">
                    {selectedInvoice.status}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-border/40 pb-4">
                <div>
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                    Issue Date
                  </span>
                  <p className="font-semibold text-foreground mt-0.5">
                    {new Date(selectedInvoice.issue_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                    Due Date
                  </span>
                  <p className="font-semibold text-foreground mt-0.5">
                    {new Date(selectedInvoice.due_date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {}
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  Items Breakdown
                </span>
                <div className="border border-border/40 rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/40 font-semibold border-b border-border/40">
                      <tr>
                        <th className="px-4 py-2">Description</th>
                        <th className="px-4 py-2 text-right">Qty</th>
                        <th className="px-4 py-2 text-right">Unit Price</th>
                        <th className="px-4 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20 text-foreground">
                      {selectedInvoice.line_items?.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2">{item.description}</td>
                          <td className="px-4 py-2 text-right">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-2 text-right">
                            ${item.unit_price.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-right font-bold">
                            ${item.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {}
              <div className="bg-muted/10 border border-border/40 rounded-lg p-4 space-y-2 text-xs font-semibold">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>${selectedInvoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Tax ({selectedInvoice.tax_rate}%):
                  </span>
                  <span>${selectedInvoice.tax_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-primary font-bold border-t border-border/40 pt-2">
                  <span>Grand Total:</span>
                  <span>${selectedInvoice.total.toFixed(2)}</span>
                </div>
              </div>

              {selectedInvoice.notes && (
                <div className="space-y-1 bg-muted/5 p-3 rounded-lg border border-border/20">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                    Notes
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {selectedInvoice.notes}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-border flex justify-end gap-2">
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 border border-border hover:bg-muted text-xs font-semibold rounded-lg"
                >
                  Close
                </button>
                <button
                  onClick={() =>
                    handleDownloadPdf(
                      selectedInvoice.id,
                      selectedInvoice.invoice_number,
                    )
                  }
                  className="px-4 py-2 bg-primary hover:opacity-90 text-primary-foreground text-xs font-semibold rounded-lg flex items-center gap-1.5"
                >
                  <Download className="size-3.5" /> Download PDF
                </button>
              </div>
            </div>
          </GlassPanel>
        </div>
      )}
    </div>
  );
}

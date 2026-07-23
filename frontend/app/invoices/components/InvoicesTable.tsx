"use client";

import React from "react";
import { Search, Plus, Download, Eye, FileText } from "lucide-react";
import { GlassPanel } from "@/components/glass/GlassPanel";
import type { Invoice } from "@/types";

interface InvoicesTableProps {
  invoices: Invoice[];
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onOpenModal: () => void;
  onPreviewInvoice: (inv: Invoice) => void;
}

export function InvoicesTable({
  invoices,
  searchTerm,
  onSearchChange,
  onOpenModal,
  onPreviewInvoice,
}: InvoicesTableProps) {
  const filtered = invoices.filter(
    (inv) =>
      inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.client_name && inv.client_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <GlassPanel intensity="regular" className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 size-4 text-[var(--color-glass-text-secondary)]" />
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-[var(--color-glass-text-primary)] placeholder:text-[var(--color-glass-text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <button
          onClick={onOpenModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          <Plus className="size-4" />
          <span>New Invoice</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-[var(--color-glass-text-primary)]">
          <thead className="text-xs uppercase text-[var(--color-glass-text-secondary)] border-b border-white/10 bg-white/5">
            <tr>
              <th className="px-6 py-3">Invoice #</th>
              <th className="px-6 py-3">Client</th>
              <th className="px-6 py-3">Issue Date</th>
              <th className="px-6 py-3">Due Date</th>
              <th className="px-6 py-3">Total Amount</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-[var(--color-glass-text-secondary)]">
                  No invoices found.
                </td>
              </tr>
            ) : (
              filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs font-semibold text-primary">
                    {inv.invoice_number}
                  </td>
                  <td className="px-6 py-4 font-medium">
                    {inv.client_name || `Client #${inv.client_id}`}
                  </td>
                  <td className="px-6 py-4 text-xs text-[var(--color-glass-text-secondary)]">
                    {inv.issue_date}
                  </td>
                  <td className="px-6 py-4 text-xs text-[var(--color-glass-text-secondary)]">
                    {inv.due_date}
                  </td>
                  <td className="px-6 py-4 font-semibold text-emerald-400">
                    ${(inv.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        inv.status === "paid"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : inv.status === "overdue"
                          ? "bg-red-500/10 text-red-400 border-red-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onPreviewInvoice(inv)}
                        className="p-1.5 text-[var(--color-glass-text-secondary)] hover:text-[var(--color-glass-text-primary)] hover:bg-white/10 rounded-lg transition-colors"
                        title="Preview Invoice PDF"
                      >
                        <Eye className="size-4" />
                      </button>
                      <a
                        href={inv.pdf_url || `/api/invoices/${inv.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-[var(--color-glass-text-secondary)] hover:text-primary hover:bg-white/10 rounded-lg transition-colors"
                        title="Download PDF"
                      >
                        <Download className="size-4" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </GlassPanel>
  );
}

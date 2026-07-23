"use client";

import React from "react";
import { Search, Plus, DollarSign, Tag, Building } from "lucide-react";
import { GlassPanel } from "@/components/glass/GlassPanel";
import type { Lead } from "@/types";

interface LeadsBoardProps {
  leads: Lead[];
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onOpenModal: () => void;
  onStatusChange: (leadId: number, status: Lead['status']) => void;
}

export function LeadsBoard({
  leads,
  searchTerm,
  onSearchChange,
  onOpenModal,
  onStatusChange,
}: LeadsBoardProps) {
  const filtered = leads.filter((l) => {
    const term = searchTerm.toLowerCase();
    return (
      (l.name && l.name.toLowerCase().includes(term)) ||
      (l.client_name && l.client_name.toLowerCase().includes(term)) ||
      (l.status && l.status.toLowerCase().includes(term))
    );
  });

  return (
    <GlassPanel intensity="regular" className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 size-4 text-[var(--color-glass-text-secondary)]" />
          <input
            type="text"
            placeholder="Search leads..."
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
          <span>Add Lead</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-[var(--color-glass-text-primary)]">
          <thead className="text-xs uppercase text-[var(--color-glass-text-secondary)] border-b border-white/10 bg-white/5">
            <tr>
              <th className="px-6 py-3">Lead / Client</th>
              <th className="px-6 py-3">Estimated Value</th>
              <th className="px-6 py-3">Source</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-sm text-[var(--color-glass-text-secondary)]">
                  No leads found.
                </td>
              </tr>
            ) : (
              filtered.map((lead) => (
                <tr key={lead.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium">
                    <div className="text-[var(--color-glass-text-primary)]">
                      {lead.name || lead.client_name || `Lead #${lead.id}`}
                    </div>
                    {lead.client_company && (
                      <div className="text-xs text-[var(--color-glass-text-secondary)] flex items-center gap-1">
                        <Building className="size-3" />
                        <span>{lead.client_company}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-semibold text-emerald-400">
                    ${(lead.value || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-xs text-[var(--color-glass-text-secondary)] capitalize">
                    <span className="flex items-center gap-1">
                      <Tag className="size-3" />
                      {lead.source || "Direct"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={lead.status}
                      onChange={(e) => onStatusChange(lead.id, e.target.value as Lead['status'])}
                      className="px-2.5 py-1 bg-white/10 border border-white/10 rounded-md text-xs font-medium text-[var(--color-glass-text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="new" className="bg-slate-900">New</option>
                      <option value="contacted" className="bg-slate-900">Contacted</option>
                      <option value="followed_up" className="bg-slate-900">Followed Up</option>
                      <option value="proposal" className="bg-slate-900">Proposal</option>
                      <option value="negotiation" className="bg-slate-900">Negotiation</option>
                      <option value="won" className="bg-slate-900">Won</option>
                      <option value="lost" className="bg-slate-900">Lost</option>
                    </select>
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

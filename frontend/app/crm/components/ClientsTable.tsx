"use client";

import React from "react";
import { Search, Plus, Mail, Phone, Building, User } from "lucide-react";
import { GlassPanel } from "@/components/glass/GlassPanel";
import type { CRMClient } from "@/types";

interface ClientsTableProps {
  clients: CRMClient[];
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onOpenModal: () => void;
}

export function ClientsTable({
  clients,
  searchTerm,
  onSearchChange,
  onOpenModal,
}: ClientsTableProps) {
  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <GlassPanel intensity="regular" className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 size-4 text-[var(--color-glass-text-secondary)]" />
          <input
            type="text"
            placeholder="Search clients..."
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
          <span>Add Client</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-[var(--color-glass-text-primary)]">
          <thead className="text-xs uppercase text-[var(--color-glass-text-secondary)] border-b border-white/10 bg-white/5">
            <tr>
              <th className="px-6 py-3">Client Name</th>
              <th className="px-6 py-3">Company</th>
              <th className="px-6 py-3">Contact</th>
              <th className="px-6 py-3">Added Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-sm text-[var(--color-glass-text-secondary)]">
                  No clients found matching your query.
                </td>
              </tr>
            ) : (
              filtered.map((client) => (
                <tr key={client.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium flex items-center gap-3">
                    <div className="size-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                      {client.name.charAt(0)}
                    </div>
                    <span>{client.name}</span>
                  </td>
                  <td className="px-6 py-4 text-[var(--color-glass-text-secondary)]">
                    <span className="flex items-center gap-1.5">
                      <Building className="size-3.5" />
                      {client.company || "Individual"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs space-y-1">
                    {client.email && (
                      <div className="flex items-center gap-1.5 text-[var(--color-glass-text-secondary)]">
                        <Mail className="size-3" />
                        <span>{client.email}</span>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-1.5 text-[var(--color-glass-text-secondary)]">
                        <Phone className="size-3" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-[var(--color-glass-text-secondary)]">
                    {client.created_at ? new Date(client.created_at).toLocaleDateString() : "Recently"}
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

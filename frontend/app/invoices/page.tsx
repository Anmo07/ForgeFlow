"use client";

import React, { useState } from "react";
import { FileText, Plus, DollarSign, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { useOrg } from "@/hooks/use-org";
import { useInvoices } from "@/hooks/use-invoices";
import { useCRMClients } from "@/hooks/use-crm-clients";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { InvoicesTable } from "./components/InvoicesTable";
import type { Invoice } from "@/types";

export default function InvoicesPage() {
  const { orgName, isOrgLoaded } = useOrg();
  const { invoices, isLoading: loadingInvoices, createInvoice } = useInvoices();
  const { clients } = useCRMClients();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const totalBilled = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const totalPaid = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + (inv.total || 0), 0);
  const totalOutstanding = invoices
    .filter((inv) => inv.status !== "paid" && inv.status !== "cancelled")
    .reduce((sum, inv) => sum + (inv.total || 0), 0);

  if (!isOrgLoaded) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="size-12 text-muted-foreground mb-4 animate-pulse" />
        <h3 className="text-lg font-semibold">Select an organization first</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-glass-text-primary)]">
          Invoices & Billing
        </h1>
        <p className="text-sm text-[var(--color-glass-text-secondary)]">
          Generate, track, and manage customer invoices for {orgName}.
        </p>
      </div>

      {/* Metrics Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassPanel intensity="regular" className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--color-glass-text-secondary)] uppercase">Total Billed</p>
            <p className="text-2xl font-bold text-[var(--color-glass-text-primary)]">
              ${totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <DollarSign className="size-8 text-primary opacity-80" />
        </GlassPanel>

        <GlassPanel intensity="regular" className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--color-glass-text-secondary)] uppercase">Total Collected</p>
            <p className="text-2xl font-bold text-emerald-400">
              ${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <CheckCircle className="size-8 text-emerald-400 opacity-80" />
        </GlassPanel>

        <GlassPanel intensity="regular" className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--color-glass-text-secondary)] uppercase">Outstanding</p>
            <p className="text-2xl font-bold text-amber-400">
              ${totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <Clock className="size-8 text-amber-400 opacity-80" />
        </GlassPanel>
      </div>

      {/* Invoices Table Component */}
      <InvoicesTable
        invoices={invoices}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onOpenModal={() => {
          if (clients.length > 0) {
            const today = new Date().toISOString().split("T")[0];
            const nextMonth = new Date(Date.now() + 30 * 86400 * 1000).toISOString().split("T")[0];
            createInvoice.mutate({
              client_id: clients[0].id,
              issue_date: today,
              due_date: nextMonth,
              subtotal: 500,
              tax_rate: 10,
              tax_amount: 50,
              total: 550,
              notes: "Standard billing invoice.",
            });
          }
        }}
        onPreviewInvoice={(inv) => setSelectedInvoice(inv)}
      />
    </div>
  );
}

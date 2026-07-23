"use client";

import React, { useState } from "react";
import { Users, DollarSign, TrendingUp, Contact, Briefcase } from "lucide-react";
import { useOrg } from "@/hooks/use-org";
import { useCRMClients } from "@/hooks/use-crm-clients";
import { useCRMLeads } from "@/hooks/use-crm-leads";
import { useCRMDeals } from "@/hooks/use-crm-deals";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { ClientsTable } from "./components/ClientsTable";
import { ClientModal } from "./components/ClientModal";
import { LeadsBoard } from "./components/LeadsBoard";
import { DealsKanban } from "./components/DealsKanban";

export default function CRMPage() {
  const { orgName, isOrgLoaded } = useOrg();
  const { clients, isLoading: loadingClients, createClient } = useCRMClients();
  const { leads, isLoading: loadingLeads, createLead, updateLeadStatus } = useCRMLeads();
  const { deals, isLoading: loadingDeals, createDeal } = useCRMDeals();

  const [activeTab, setActiveTab] = useState<"clients" | "leads" | "deals">("clients");
  const [searchTerm, setSearchTerm] = useState("");
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  const pipelineValue = deals.reduce((sum, d) => sum + (d.value || 0), 0) +
    leads.reduce((sum, l) => sum + (l.value || 0), 0);

  if (!isOrgLoaded) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="size-12 text-muted-foreground mb-4 animate-pulse" />
        <h3 className="text-lg font-semibold">Select an organization first</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-glass-text-primary)]">
          CRM & Revenue Workspace
        </h1>
        <p className="text-sm text-[var(--color-glass-text-secondary)]">
          Manage client relationships, leads pipeline, and deal flows for {orgName}.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassPanel intensity="regular" className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--color-glass-text-secondary)] uppercase">Active Clients</p>
            <p className="text-2xl font-bold text-[var(--color-glass-text-primary)]">{clients.length}</p>
          </div>
          <Contact className="size-8 text-primary opacity-80" />
        </GlassPanel>

        <GlassPanel intensity="regular" className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--color-glass-text-secondary)] uppercase">Active Leads</p>
            <p className="text-2xl font-bold text-[var(--color-glass-text-primary)]">{leads.length}</p>
          </div>
          <Users className="size-8 text-emerald-400 opacity-80" />
        </GlassPanel>

        <GlassPanel intensity="regular" className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--color-glass-text-secondary)] uppercase">Pipeline Value</p>
            <p className="text-2xl font-bold text-emerald-400">${pipelineValue.toLocaleString()}</p>
          </div>
          <DollarSign className="size-8 text-emerald-400 opacity-80" />
        </GlassPanel>

        <GlassPanel intensity="regular" className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--color-glass-text-secondary)] uppercase">Total Deals</p>
            <p className="text-2xl font-bold text-[var(--color-glass-text-primary)]">{deals.length}</p>
          </div>
          <Briefcase className="size-8 text-primary opacity-80" />
        </GlassPanel>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab("clients")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === "clients"
              ? "bg-primary text-primary-foreground"
              : "text-[var(--color-glass-text-secondary)] hover:bg-white/5"
          }`}
        >
          Clients ({clients.length})
        </button>
        <button
          onClick={() => setActiveTab("leads")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === "leads"
              ? "bg-primary text-primary-foreground"
              : "text-[var(--color-glass-text-secondary)] hover:bg-white/5"
          }`}
        >
          Leads ({leads.length})
        </button>
        <button
          onClick={() => setActiveTab("deals")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === "deals"
              ? "bg-primary text-primary-foreground"
              : "text-[var(--color-glass-text-secondary)] hover:bg-white/5"
          }`}
        >
          Deals ({deals.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "clients" && (
        <ClientsTable
          clients={clients}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onOpenModal={() => setIsClientModalOpen(true)}
        />
      )}

      {activeTab === "leads" && (
        <LeadsBoard
          leads={leads}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onOpenModal={() => setIsClientModalOpen(true)}
          onStatusChange={(id, status) => updateLeadStatus.mutate({ leadId: id, status })}
        />
      )}

      {activeTab === "deals" && (
        <DealsKanban
          deals={deals}
          onOpenModal={() => setIsClientModalOpen(true)}
        />
      )}

      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSubmit={(payload) => {
          createClient.mutate(payload, {
            onSuccess: () => setIsClientModalOpen(false),
          });
        }}
        isSubmitting={createClient.isPending}
      />
    </div>
  );
}

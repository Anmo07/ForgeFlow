"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Search,
  DollarSign,
  Percent,
  Contact,
  Mail,
  Phone,
  Building,
  TrendingUp,
  Tag,
  Loader2,
  AlertCircle,
  X,
  User,
  Briefcase,
} from "lucide-react";
import { useOrgStore } from "@/store/organization";
import { apiFetch } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { cn } from "@/lib/utils";

interface Client {
  id: number;
  organization_id: number;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  created_at: string;
}

interface Lead {
  id: number;
  organization_id: number;
  client_id: number;
  status: string;
  value: number;
  source: string | null;
  assigned_to: number | null;
  created_at: string;
  client_name?: string;
  client_company?: string;
  client_email?: string;
  client_phone?: string;
}

interface Deal {
  id: number;
  organization_id: number;
  lead_id: number;
  name: string | null;
  value: number;
  status: string;
  assigned_to: number | null;
  closed_at: string | null;
  created_at: string;
}

interface CRMMetrics {
  active_leads: number;
  pipeline_value: number;
  deals_won_value: number;
  conversion_rate: number;
  total_clients: number;
}

interface Member {
  user_id: number;
  user_name: string;
  user_email: string;
}

export default function CRMPage() {
  const { currentOrg } = useOrgStore();

  const [activeTab, setActiveTab] = useState<"clients" | "leads" | "deals">(
    "leads",
  );

  const queryClient = useQueryClient();

  const { data: qClients, isFetching: isFetchingClients, isLoading: isLoadingClients } = useQuery<Client[]>({
    queryKey: ["crmClients", currentOrg?.id],
    queryFn: () => apiFetch<Client[]>("/api/crm/clients", { orgId: currentOrg?.id }),
    enabled: !!currentOrg?.id,
  });

  const { data: qLeads, isFetching: isFetchingLeads, isLoading: isLoadingLeads } = useQuery<Lead[]>({
    queryKey: ["crmLeads", currentOrg?.id],
    queryFn: () => apiFetch<Lead[]>("/api/crm/leads", { orgId: currentOrg?.id }),
    enabled: !!currentOrg?.id,
  });

  const { data: qDeals, isFetching: isFetchingDeals, isLoading: isLoadingDeals } = useQuery<Deal[]>({
    queryKey: ["crmDeals", currentOrg?.id],
    queryFn: () => apiFetch<Deal[]>("/api/crm/deals", { orgId: currentOrg?.id }),
    enabled: !!currentOrg?.id,
  });

  const { data: qMetrics, isFetching: isFetchingMetrics, isLoading: isLoadingMetrics } = useQuery<CRMMetrics>({
    queryKey: ["crmMetrics", currentOrg?.id],
    queryFn: () => apiFetch<CRMMetrics>("/api/crm/metrics", { orgId: currentOrg?.id }),
    enabled: !!currentOrg?.id,
  });

  const { data: qMembers, isFetching: isFetchingMembers, isLoading: isLoadingMembers } = useQuery<Member[]>({
    queryKey: ["orgMembers", currentOrg?.id],
    queryFn: () => apiFetch<Member[]>(`/api/memberships/organization/${currentOrg?.id}`, { orgId: currentOrg?.id }).catch(() => []),
    enabled: !!currentOrg?.id,
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [metrics, setMetrics] = useState<CRMMetrics>({
    active_leads: 0,
    pipeline_value: 0,
    deals_won_value: 0,
    conversion_rate: 0,
    total_clients: 0,
  });
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    if (qClients) setClients(qClients);
  }, [qClients]);

  useEffect(() => {
    if (qLeads) setLeads(qLeads);
  }, [qLeads]);

  useEffect(() => {
    if (qDeals) setDeals(qDeals);
  }, [qDeals]);

  useEffect(() => {
    if (qMetrics) setMetrics(qMetrics);
  }, [qMetrics]);

  useEffect(() => {
    if (qMembers) setMembers(qMembers);
  }, [qMembers]);

  const loading = isLoadingClients || isLoadingLeads || isLoadingDeals || isLoadingMetrics || isLoadingMembers;
  const isRefreshing = isFetchingClients || isFetchingLeads || isFetchingDeals || isFetchingMetrics || isFetchingMembers;
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [errorMsg, setErrorMsg] = useState("");

  const [activeModal, setActiveModal] = useState<
    "client" | "lead" | "deal" | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientCompany, setClientCompany] = useState("");

  const [leadClientId, setLeadClientId] = useState("");
  const [leadStatus, setLeadStatus] = useState("new");
  const [leadValue, setLeadValue] = useState("");
  const [leadSource, setLeadSource] = useState("website");
  const [leadAssignee, setLeadAssignee] = useState("");

  const [dealLeadId, setDealLeadId] = useState("");
  const [dealName, setDealName] = useState("");
  const [dealValueVal, setDealValueVal] = useState("");
  const [dealStatus, setDealStatus] = useState("discovery");
  const [dealAssignee, setDealAssignee] = useState("");

  const loadCRMData = async () => {
    if (!currentOrg) return;
    setErrorMsg("");
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["crmClients", currentOrg.id] }),
        queryClient.invalidateQueries({ queryKey: ["crmLeads", currentOrg.id] }),
        queryClient.invalidateQueries({ queryKey: ["crmDeals", currentOrg.id] }),
        queryClient.invalidateQueries({ queryKey: ["crmMetrics", currentOrg.id] }),
        queryClient.invalidateQueries({ queryKey: ["orgMembers", currentOrg.id] }),
      ]);
    } catch (err: unknown) {
      console.error("Error invalidating CRM queries:", err);
      setErrorMsg(err instanceof Error ? err.message : "Failed to load CRM data");
    }
  };

  useEffect(() => {
    if (currentOrg) {
      loadCRMData();
    }
    window.addEventListener("orgChanged", loadCRMData);
    return () => window.removeEventListener("orgChanged", loadCRMData);
  }, [currentOrg]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !clientName) return;
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      await apiFetch("/api/crm/clients", {
        orgId: currentOrg.id,
        method: "POST",
        body: JSON.stringify({
          name: clientName,
          email: clientEmail || null,
          phone: clientPhone || null,
          company: clientCompany || null,
        }),
      });
      setActiveModal(null);
      setClientName("");
      setClientEmail("");
      setClientPhone("");
      setClientCompany("");
      await loadCRMData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to create client");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !leadClientId) return;
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      await apiFetch("/api/crm/leads", {
        orgId: currentOrg.id,
        method: "POST",
        body: JSON.stringify({
          client_id: Number(leadClientId),
          status: leadStatus,
          value: leadValue ? Number(leadValue) : 0,
          source: leadSource || null,
          assigned_to: leadAssignee ? Number(leadAssignee) : null,
        }),
      });
      setActiveModal(null);
      setLeadClientId("");
      setLeadStatus("new");
      setLeadValue("");
      setLeadSource("website");
      setLeadAssignee("");
      await loadCRMData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to create lead");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !dealLeadId) return;
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      await apiFetch("/api/crm/deals", {
        orgId: currentOrg.id,
        method: "POST",
        body: JSON.stringify({
          lead_id: Number(dealLeadId),
          name: dealName || null,
          value: dealValueVal ? Number(dealValueVal) : 0,
          status: dealStatus,
          assigned_to: dealAssignee ? Number(dealAssignee) : null,
        }),
      });
      setActiveModal(null);
      setDealLeadId("");
      setDealName("");
      setDealValueVal("");
      setDealStatus("discovery");
      setDealAssignee("");
      await loadCRMData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to create deal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateLeadStatus = async (leadId: number, nextStatus: string) => {
    if (!currentOrg) return;
    try {
      await apiFetch(`/api/crm/leads/${leadId}`, {
        orgId: currentOrg.id,
        method: "PUT",
        body: JSON.stringify({ status: nextStatus }),
      });
      await loadCRMData();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg("Failed to update lead status");
    }
  };

  const handleUpdateDealStatus = async (dealId: number, nextStatus: string) => {
    if (!currentOrg) return;
    try {
      await apiFetch(`/api/crm/deals/${dealId}`, {
        orgId: currentOrg.id,
        method: "PUT",
        body: JSON.stringify({ status: nextStatus }),
      });
      await loadCRMData();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg("Failed to update deal status");
    }
  };

  const handleDealDragStart = (e: React.DragEvent, dealId: number) => {
    e.dataTransfer.setData("text/plain", dealId.toString());
  };

  const handleDealDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDealDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const dealIdStr = e.dataTransfer.getData("text/plain");
    if (!dealIdStr) return;
    const dealId = Number(dealIdStr);
    await handleUpdateDealStatus(dealId, targetStatus);
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.company &&
        c.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      (l.client_name &&
        l.client_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (l.client_company &&
        l.client_company.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus =
      statusFilter === "All" ||
      l.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const filteredDeals = deals.filter((d) => {
    const matchesSearch =
      d.name && d.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "All" ||
      d.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  if (!currentOrg) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Users className="size-16 text-muted-foreground/50 mb-4 animate-pulse" />
        <h3 className="text-xl font-bold tracking-tight">
          Select an organization
        </h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          Please select or create an organization from the workspace switcher in
          the header to view and manage CRM entries.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM Hub</h1>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-muted-foreground text-sm">
              Track clients, incoming leads, and pipeline deals.
            </p>
            {isRefreshing && !loading && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded animate-pulse">
                <Loader2 className="size-2.5 animate-spin" />
                Refreshing...
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveModal("client")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground px-4 py-2.5 text-sm font-semibold transition-colors duration-200"
          >
            <Plus className="size-4" />
            New Client
          </button>
          <button
            onClick={() => setActiveModal("lead")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary hover:opacity-90 text-primary-foreground px-4 py-2.5 text-sm font-semibold shadow transition-colors duration-200"
          >
            <Plus className="size-4 stroke-[2.5]" />
            New Lead
          </button>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card/30 backdrop-blur-sm p-5 shadow-sm hover:border-primary/30 transition-all duration-300">
          <div className="flex justify-between items-center text-muted-foreground mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Active Leads
            </span>
            <Users className="size-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-foreground">
            {metrics.active_leads}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Currently being qualified
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card/30 backdrop-blur-sm p-5 shadow-sm hover:border-primary/30 transition-all duration-300">
          <div className="flex justify-between items-center text-muted-foreground mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Pipeline Value
            </span>
            <DollarSign className="size-4 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-blue-400">
            ${metrics.pipeline_value.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Open deals expectation
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card/30 backdrop-blur-sm p-5 shadow-sm hover:border-primary/30 transition-all duration-300">
          <div className="flex justify-between items-center text-muted-foreground mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Closed Won
            </span>
            <TrendingUp className="size-4 text-primary" />
          </div>
          <div className="text-3xl font-bold text-primary">
            ${metrics.deals_won_value.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Converted contract value
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card/30 backdrop-blur-sm p-5 shadow-sm hover:border-primary/30 transition-all duration-300">
          <div className="flex justify-between items-center text-muted-foreground mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Conversion Rate
            </span>
            <Percent className="size-4 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-purple-400">
            {metrics.conversion_rate}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Lead won conversion ratio
          </p>
        </div>
      </div>

      {}
      <div className="flex border-b border-border">
        <button
          onClick={() => {
            setActiveTab("leads");
            setSearchTerm("");
            setStatusFilter("All");
          }}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all duration-200 ${activeTab === "leads" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Leads Pipeline ({leads.length})
        </button>
        <button
          onClick={() => {
            setActiveTab("deals");
            setSearchTerm("");
            setStatusFilter("All");
          }}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all duration-200 ${activeTab === "deals" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Deals Hub ({deals.length})
        </button>
        <button
          onClick={() => {
            setActiveTab("clients");
            setSearchTerm("");
            setStatusFilter("All");
          }}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all duration-200 ${activeTab === "clients" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Clients ({clients.length})
        </button>
      </div>

      {}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card/30 border border-border rounded-xl p-4 shadow-sm backdrop-blur-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={
              activeTab === "clients"
                ? "Search clients..."
                : activeTab === "leads"
                  ? "Search leads..."
                  : "Search deals..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-background/50 border border-border rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
        {activeTab !== "clients" && (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-background/50 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/50"
            >
              <option value="All">All Stages</option>
              {activeTab === "leads" ? (
                <>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="proposal">Proposal</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </>
              ) : (
                <>
                  <option value="discovery">Discovery</option>
                  <option value="proposal">Proposal</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="closed_won">Closed Won</option>
                  <option value="closed_lost">Closed Lost</option>
                </>
              )}
            </select>
          </div>
        )}
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
            Loading CRM...
          </span>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card/20 shadow-sm overflow-hidden backdrop-blur-sm">
          {activeTab === "clients" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/30 text-muted-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="px-6 py-4">Client Name</th>
                    <th className="px-6 py-4">Company</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4">Registered Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-foreground">
                  {filteredClients.map((client) => (
                    <tr
                      key={client.id}
                      className="hover:bg-muted/10 transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold flex items-center gap-2">
                        <Contact className="size-4 text-primary/80" />
                        {client.name}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        <Building className="size-3.5 inline mr-1.5" />
                        {client.company || "Individual"}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {client.email || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {client.phone || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {new Date(client.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {filteredClients.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-muted-foreground"
                      >
                        No clients matching your search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "leads" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/30 text-muted-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="px-6 py-4">Lead Owner/Client</th>
                    <th className="px-6 py-4">Company</th>
                    <th className="px-6 py-4">Contact Detail</th>
                    <th className="px-6 py-4">Lead Stage</th>
                    <th className="px-6 py-4 text-right">Value</th>
                    <th className="px-6 py-4">Source</th>
                    <th className="px-6 py-4 text-center">Move Stage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-foreground">
                  {filteredLeads.map((lead) => {
                    let badgeColor =
                      "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20";
                    if (lead.status === "won")
                      badgeColor =
                        "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                    if (lead.status === "lost")
                      badgeColor =
                        "bg-rose-500/10 text-rose-400 border border-rose-500/20";
                    if (
                      lead.status === "qualified" ||
                      lead.status === "proposal"
                    )
                      badgeColor =
                        "bg-primary/10 text-primary border border-primary/20";

                    return (
                      <tr
                        key={lead.id}
                        className="hover:bg-muted/10 transition-colors"
                      >
                        <td className="px-6 py-4 font-semibold flex items-center gap-2">
                          <Contact className="size-4 text-primary/80" />
                          {lead.client_name || "Unknown"}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {lead.client_company || "Individual"}
                        </td>
                        <td className="px-6 py-4 space-y-0.5 text-xs">
                          {lead.client_email && (
                            <a
                              href={`mailto:${lead.client_email}`}
                              className="text-primary hover:underline block"
                            >
                              {lead.client_email}
                            </a>
                          )}
                          <span className="text-muted-foreground">
                            {lead.client_phone || ""}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeColor}`}
                          >
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-foreground">
                          ${lead.value.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-xs text-muted-foreground capitalize">
                          {lead.source || "Unknown"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-1.5">
                            <select
                              value={lead.status}
                              onChange={(e) =>
                                handleUpdateLeadStatus(lead.id, e.target.value)
                              }
                              className="bg-background/80 border border-border rounded px-2 py-1 text-xs outline-none text-foreground"
                            >
                              <option value="new">New</option>
                              <option value="contacted">Contacted</option>
                              <option value="qualified">Qualified</option>
                              <option value="proposal">Proposal</option>
                              <option value="won">Won</option>
                              <option value="lost">Lost</option>
                            </select>
                            {lead.status === "qualified" && (
                              <button
                                onClick={() => {
                                  setDealLeadId(String(lead.id));
                                  setDealName(
                                    `${lead.client_name || "Acme"} Deal`,
                                  );
                                  setDealValueVal(String(lead.value));
                                  setActiveModal("deal");
                                }}
                                className="bg-primary hover:opacity-90 text-primary-foreground px-2 py-1 rounded text-xs font-semibold"
                                title="Convert to Deal"
                              >
                                Convert
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredLeads.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-12 text-center text-muted-foreground"
                      >
                        No leads matching your search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "deals" && (
            <div className="flex gap-6 overflow-x-auto pb-4 pt-2 -mx-4 px-4 min-h-[550px] scrollbar-thin">
              {[
                { id: "discovery", name: "Discovery", color: "bg-zinc-400" },
                { id: "proposal", name: "Proposal", color: "bg-blue-400" },
                { id: "negotiation", name: "Negotiation", color: "bg-amber-400" },
                { id: "closed_won", name: "Closed Won", color: "bg-emerald-400", accent: "emerald" as const },
                { id: "closed_lost", name: "Closed Lost", color: "bg-rose-400" },
              ].map((stage) => {
                const stageDeals = filteredDeals.filter((d) => d.status === stage.id);
                return (
                  <div
                    key={stage.id}
                    onDragOver={handleDealDragOver}
                    onDrop={(e) => handleDealDrop(e, stage.id)}
                    className="flex flex-col w-[280px] shrink-0 min-h-[500px] bg-white/5 dark:bg-black/20 border border-[var(--color-glass-clear-border)] dark:border-[var(--color-glass-dark-clear-border)] rounded-[var(--radius-glass-xl)] p-4"
                  >
                    {/* Column header */}
                    {stage.accent === "emerald" ? (
                      <GlassPanel
                        variant="heavy"
                        accentGradient="emerald"
                        radius="pill"
                        className="px-4 py-2 flex items-center justify-between mb-4 flex-shrink-0 shadow-[var(--shadow-glass-sm)] dark:shadow-[var(--shadow-glass-dark-sm)] border border-[var(--color-glass-clear-border)] dark:border-[var(--color-glass-dark-clear-border)]"
                      >
                        <div className="flex items-center gap-2">
                          <span className="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span className="text-sm font-bold text-white">
                            {stage.name}
                          </span>
                        </div>
                        <span className="text-xs font-extrabold bg-white/20 text-white px-2 py-0.5 rounded-[var(--radius-glass-pill)]">
                          {stageDeals.length}
                        </span>
                      </GlassPanel>
                    ) : (
                      <div className="glass-clear rounded-[var(--radius-glass-pill)] px-4 py-2 border border-[var(--color-glass-clear-border)] dark:border-[var(--color-glass-dark-clear-border)] flex items-center justify-between mb-4 flex-shrink-0 shadow-[var(--shadow-glass-sm)] dark:shadow-[var(--shadow-glass-dark-sm)]">
                        <div className="flex items-center gap-2">
                          <span className={`size-2 rounded-full ${stage.color}`}></span>
                          <span className="text-sm font-semibold text-[var(--color-glass-text-primary)] dark:text-[var(--color-glass-dark-text-primary)]">
                            {stage.name}
                          </span>
                        </div>
                        <span className="text-xs font-bold glass-clear border border-[var(--color-glass-clear-border)] dark:border-[var(--color-glass-dark-clear-border)] px-2 py-0.5 rounded-[var(--radius-glass-pill)] text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)]">
                          {stageDeals.length}
                        </span>
                      </div>
                    )}

                    {/* Column body */}
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                      {stageDeals.map((deal) => (
                        <DealCard
                          key={deal.id}
                          deal={deal}
                          leads={leads}
                          onEdit={(d) => {
                            // Deal edit / view stage
                          }}
                          onDragStart={handleDealDragStart}
                        />
                      ))}
                      {stageDeals.length === 0 && (
                        <div className="h-full min-h-[150px] flex items-center justify-center text-center p-6 border-2 border-dashed border-border/50 rounded-lg text-xs text-muted-foreground/60 select-none">
                          Drag deals here
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {}
      {activeModal === "client" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-lg rounded-xl shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">
                Add New Client
              </h2>
              <button
                onClick={() => setActiveModal(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleCreateClient} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Client Name
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Email
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Phone
                </label>
                <input
                  type="text"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="555-123-4567"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Company Name
                </label>
                <input
                  type="text"
                  value={clientCompany}
                  onChange={(e) => setClientCompany(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <div className="pt-4 border-t border-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
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
                  Add Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {}
      {activeModal === "lead" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-lg rounded-xl shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">
                Add New Lead
              </h2>
              <button
                onClick={() => setActiveModal(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleCreateLead} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Select Client
                </label>
                <select
                  required
                  value={leadClientId}
                  onChange={(e) => setLeadClientId(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/50"
                >
                  <option value="">Choose a client...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company ? `(${c.company})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Lead Stage
                  </label>
                  <select
                    value={leadStatus}
                    onChange={(e) => setLeadStatus(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/50"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="proposal">Proposal</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Lead Value ($)
                  </label>
                  <input
                    type="number"
                    value={leadValue}
                    onChange={(e) => setLeadValue(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Lead Source
                  </label>
                  <select
                    value={leadSource}
                    onChange={(e) => setLeadSource(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/50"
                  >
                    <option value="website">Website</option>
                    <option value="outreach">Outreach</option>
                    <option value="inbound">Inbound</option>
                    <option value="social">Social Campaign</option>
                    <option value="partner">Partner Referral</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Assignee
                  </label>
                  <select
                    value={leadAssignee}
                    onChange={(e) => setLeadAssignee(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/50"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.user_name || m.user_email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="pt-4 border-t border-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
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
                  Add Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {}
      {activeModal === "deal" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-lg rounded-xl shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">
                Convert Lead to Deal
              </h2>
              <button
                onClick={() => setActiveModal(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleCreateDeal} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Deal Name
                </label>
                <input
                  type="text"
                  required
                  value={dealName}
                  onChange={(e) => setDealName(e.target.value)}
                  placeholder="e.g. Acme Web Redesign Deal"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Deal Stage
                  </label>
                  <select
                    value={dealStatus}
                    onChange={(e) => setDealStatus(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/50"
                  >
                    <option value="discovery">Discovery</option>
                    <option value="proposal">Proposal</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="closed_won">Closed Won</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Deal Value ($)
                  </label>
                  <input
                    type="number"
                    required
                    value={dealValueVal}
                    onChange={(e) => setDealValueVal(e.target.value)}
                    placeholder="e.g. 10000"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Assignee
                </label>
                <select
                  value={dealAssignee}
                  onChange={(e) => setDealAssignee(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/50"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.user_name || m.user_email}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pt-4 border-t border-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
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
                  Convert & Launch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

interface DealCardProps {
  deal: Deal;
  leads: Lead[];
  onEdit: (deal: Deal) => void;
  onDragStart: (e: React.DragEvent, dealId: number) => void;
}

function DealCard({
  deal,
  leads,
  onEdit,
  onDragStart,
}: DealCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const lead = leads.find((l) => l.id === deal.lead_id);
  const clientName = lead ? lead.client_name || lead.client_company || "Client" : "Client";

  // Calculate simulated win probability
  const getProbability = () => {
    switch (deal.status) {
      case "discovery":
        return 15;
      case "proposal":
        return 40;
      case "negotiation":
        return 75;
      case "closed_won":
        return 100;
      case "closed_lost":
        return 0;
      default:
        return 50;
    }
  };

  const prob = getProbability();
  let probClass = "text-amber-600 dark:text-amber-400 border-amber-500/20";
  if (prob < 25) {
    probClass = "text-red-600 dark:text-red-400 border-red-500/20";
  } else if (prob > 60) {
    probClass = "text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
  }

  const handleDragStartLocal = (e: React.DragEvent) => {
    setIsDragging(true);
    onDragStart(e, deal.id);
  };

  const handleDragEndLocal = () => {
    setIsDragging(false);
  };

  return (
    <GlassPanel
      variant="regular"
      radius="lg"
      draggable
      onDragStart={handleDragStartLocal}
      onDragEnd={handleDragEndLocal}
      className={cn(
        "p-4 cursor-grab active:cursor-grabbing transition-all duration-150 select-none space-y-3 group border-[var(--color-glass-regular-border)] dark:border-[var(--color-glass-dark-regular-border)]",
        isDragging
          ? "opacity-60 scale-[1.02] shadow-[var(--shadow-glass-lg)] dark:shadow-[var(--shadow-glass-dark-lg)]"
          : "hover:shadow-[var(--shadow-glass-md)] dark:hover:shadow-[var(--shadow-glass-dark-md)]"
      )}
    >
      <div className="flex justify-between items-start gap-2">
        <span
          className={cn(
            "text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-[var(--radius-glass-pill)] border glass-clear",
            probClass
          )}
        >
          {prob}% Win Prob
        </span>
        <button
          onClick={() => onEdit(deal)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)] hover:text-blue-500 hover:bg-[var(--color-glass-hover)] dark:hover:bg-[var(--color-glass-dark-hover)] rounded transition-colors"
          title="Edit Deal"
        >
          {/* We'll use Contact or user edit indicator since Edit2 will be imported */}
          <Contact className="size-3" />
        </button>
      </div>

      <div>
        <h4 className="font-bold text-sm text-[var(--color-glass-text-primary)] dark:text-[var(--color-glass-dark-text-primary)] leading-snug">
          {deal.name || "Unnamed Deal"}
        </h4>
        <p className="text-xs text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)] truncate mt-0.5">
          {clientName}
        </p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-[var(--color-glass-regular-border)] dark:border-[var(--color-glass-dark-regular-border)] text-[10px] text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)]">
        <span className="font-bold text-sm text-[var(--color-glass-text-primary)] dark:text-[var(--color-glass-dark-text-primary)]">
          ${deal.value.toLocaleString()}
        </span>
        <span className="text-[9px] text-[var(--color-glass-text-tertiary)] dark:text-[var(--color-glass-dark-text-tertiary)]">
          {deal.closed_at ? new Date(deal.closed_at).toLocaleDateString() : "Open"}
        </span>
      </div>
    </GlassPanel>
  );
}


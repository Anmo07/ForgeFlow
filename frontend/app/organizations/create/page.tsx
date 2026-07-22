"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useOrgStore, Organization } from "@/store/organization";
import { useAuthStore } from "@/store/auth";
import { Building2, Plus, Trash2, Shield, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { GlassPanel } from "@/components/glass/GlassPanel";

interface InvitedMember {
  email: string;
  fullName: string;
  roleId: number;
}

export default function CreateOrganizationPage() {
  const router = useRouter();
  const { setCurrentOrg } = useOrgStore();
  const { user } = useAuthStore();
  
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("MSP / IT Services");
  const [companySize, setCompanySize] = useState("1-10");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [invitedMembers, setInvitedMembers] = useState<InvitedMember[]>([
    { email: "", fullName: "", roleId: 2 } // Initial empty member
  ]);

  const handleNameChange = (val: string) => {
    setName(val);
    // Auto-generate slug
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setSlug(generatedSlug);
  };

  const handleAddMember = () => {
    setInvitedMembers([...invitedMembers, { email: "", fullName: "", roleId: 2 }]);
  };

  const handleRemoveMember = (index: number) => {
    setInvitedMembers(invitedMembers.filter((_, idx) => idx !== index));
  };

  const handleMemberChange = (index: number, field: keyof InvitedMember, val: string | number) => {
    const updated = [...invitedMembers];
    updated[index] = { ...updated[index], [field]: val };
    setInvitedMembers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Organization name is required");
      return;
    }
    if (!slug.trim()) {
      setError("Slug is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const orgId = Date.now();
      const currentUserEmail = user?.email || "owner@company.com";
      const currentUserFullName = user?.full_name || "Workspace Owner";

      // 1. Create Organization Object
      const newOrg: Organization & { ownerEmail: string } = {
        id: orgId,
        uuid: `org-${orgId}`,
        name: name.trim(),
        slug: slug.trim(),
        logo_url: "",
        industry,
        company_size: companySize,
        website: website.trim(),
        description: description.trim(),
        ownerEmail: currentUserEmail
      };

      // 2. Build Initial Members List (User + Invited Members)
      const listMembers = [
        {
          id: 1,
          joined_at: new Date().toISOString(),
          status: "active",
          user: { id: 101, email: currentUserEmail, full_name: currentUserFullName },
          role: { id: 1, name: "Owner" }
        }
      ];

      // Append custom invited members
      invitedMembers.forEach((m, idx) => {
        if (m.email.trim()) {
          listMembers.push({
            id: Date.now() + idx + 10,
            joined_at: new Date().toISOString(),
            status: "invited",
            user: {
              id: Date.now() + idx + 100,
              email: m.email.trim(),
              full_name: m.fullName.trim() || m.email.trim().split("@")[0]
            },
            role: {
              id: m.roleId,
              name: m.roleId === 1 ? "Owner" : (m.roleId === 2 ? "Admin" : "Member")
            }
          });
        }
      });

      // 3. Build Initial Roles
      const listRoles = [
        { id: 1, name: "Admin", description: "Full administrative access", is_system: true, permissions: [] },
        { id: 2, name: "Member", description: "Standard user access", is_system: true, permissions: [] },
        { id: 3, name: "Viewer", description: "Read-only access", is_system: true, permissions: [] }
      ];

      // 4. Build Initial Logs
      const listLogs = [
        {
          id: 1,
          organization_id: orgId,
          user_id: 101,
          action: "Organization Created",
          entity_type: "Organization",
          entity_id: orgId,
          metadata_json: { ip: "127.0.0.1", details: `Created tenant "${name}" in sector "${industry}"` },
          ip_address: "127.0.0.1",
          user_agent: "Browser Client",
          created_at: new Date().toISOString()
        }
      ];

      listMembers.forEach((m) => {
        if (m.id !== 1) {
          listLogs.push({
            id: m.id + 50,
            organization_id: orgId,
            user_id: 101,
            action: "Member Invited",
            entity_type: "Membership",
            entity_id: m.id,
            metadata_json: { ip: "127.0.0.1", details: `Invited ${m.user.email} as ${m.role.name}` },
            ip_address: "127.0.0.1",
            user_agent: "Browser Client",
            created_at: new Date().toISOString()
          });
        }
      });

      // 5. Build Initial Active Sessions
      const listSessions = [
        {
          id: Date.now() + 500,
          device_name: "Active Workstation",
          browser: "Chrome Client",
          operating_system: "macOS",
          ip_address: "127.0.0.1",
          last_activity: new Date().toISOString(),
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          revoked: false,
          is_current: true
        }
      ];

      // 6. Persist everything under respective isolated tenant keys in localStorage
      const customOrgs = JSON.parse(localStorage.getItem("forgeflow_custom_organizations") || "[]");
      customOrgs.push(newOrg);
      localStorage.setItem("forgeflow_custom_organizations", JSON.stringify(customOrgs));

      localStorage.setItem(`forgeflow_custom_members_${orgId}`, JSON.stringify(listMembers));
      localStorage.setItem(`forgeflow_custom_roles_${orgId}`, JSON.stringify(listRoles));
      localStorage.setItem(`forgeflow_custom_logs_${orgId}`, JSON.stringify(listLogs));
      localStorage.setItem(`forgeflow_custom_sessions_${orgId}`, JSON.stringify(listSessions));

      // 7. Re-sync active tenant store & invalidate organization queries
      setCurrentOrg(newOrg);
      try {
        const { queryClient } = await import("@/lib/query-client");
        await queryClient.invalidateQueries({ queryKey: ["organizations"] });
      } catch (e) {}

      // Trigger redraw of header
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("orgChanged"));
      }

      // Success redirect
      router.push("/settings/members");
    } catch (err: any) {
      setError("An unexpected error occurred: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-1 items-center justify-center p-6 overflow-hidden min-h-screen">
      <div className="absolute inset-0 z-[-1] pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] rounded-full bg-primary/10 blur-[80px]" />
        <div className="absolute bottom-0 left-1/4 w-[350px] h-[350px] rounded-full bg-[#a855f7]/10 blur-[70px]" />
      </div>

      <div className="w-full max-w-2xl z-10 my-8">
        <GlassPanel
          variant="heavy"
          radius="xl"
          className="p-8 border border-[var(--color-glass-regular-border)] dark:border-[var(--color-glass-dark-regular-border)] shadow-[var(--shadow-glass-lg)] dark:shadow-[var(--shadow-glass-dark-lg)]"
        >
          <div className="flex flex-col mb-8">
            <Link href="/" className="mb-4 inline-flex items-center gap-2 text-xs font-bold text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)] hover:text-blue-500 transition-colors">
              <ArrowLeft className="size-3.5" /> Back to Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-10 rounded-lg bg-blue-500/10 text-blue-500">
                <Building2 className="size-5" />
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-bold tracking-tight text-[var(--color-glass-text-primary)] dark:text-[var(--color-glass-dark-text-primary)]">Create Organization</h1>
                <p className="text-sm text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)]">Setup a secure isolated tenant for your client workspace</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 text-left">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)] mb-3">Organization Profile</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="org-name" className="text-xs font-semibold text-[var(--color-glass-text-primary)] dark:text-[var(--color-glass-dark-text-primary)]">Organization Name</label>
                  <input
                    id="org-name"
                    type="text"
                    required
                    placeholder="e.g. NovaTech Operations"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full h-9 rounded-[var(--radius-glass-md)] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors duration-120 shadow-sm"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label htmlFor="org-slug" className="text-xs font-semibold text-[var(--color-glass-text-primary)] dark:text-[var(--color-glass-dark-text-primary)]">Workspace URL slug</label>
                  <div className="flex items-center">
                    <input
                      id="org-slug"
                      type="text"
                      required
                      placeholder="e.g. novatech-ops"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="w-full h-9 rounded-l-[var(--radius-glass-md)] border-y border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors duration-120 shadow-sm"
                    />
                    <span className="h-9 px-3 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-r-[var(--radius-glass-md)] flex items-center text-xs text-gray-500 dark:text-gray-400 shrink-0 select-none">
                      .forgeflow.io
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="org-website" className="text-xs font-semibold text-[var(--color-glass-text-primary)] dark:text-[var(--color-glass-dark-text-primary)]">Company Website</label>
                <input
                  id="org-website"
                  type="text"
                  placeholder="e.g. https://novatech.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full h-9 rounded-[var(--radius-glass-md)] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors duration-120 shadow-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="org-industry" className="text-xs font-semibold text-[var(--color-glass-text-primary)] dark:text-[var(--color-glass-dark-text-primary)]">Industry Sector</label>
                <select
                  id="org-industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full h-9 rounded-[var(--radius-glass-md)] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2.5 py-1 text-sm text-gray-900 dark:text-gray-100 outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors duration-120 shadow-sm"
                >
                  <option value="MSP / IT Services">MSP / IT Services</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                  <option value="Software Development">Software Development</option>
                  <option value="Finance & Accounting">Finance & Accounting</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="org-size" className="text-xs font-semibold text-[var(--color-glass-text-primary)] dark:text-[var(--color-glass-dark-text-primary)]">Company Size</label>
                <select
                  id="org-size"
                  value={companySize}
                  onChange={(e) => setCompanySize(e.target.value)}
                  className="w-full h-9 rounded-[var(--radius-glass-md)] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2.5 py-1 text-sm text-gray-900 dark:text-gray-100 outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors duration-120 shadow-sm"
                >
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="500+">500+ employees</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="org-desc" className="text-xs font-semibold text-[var(--color-glass-text-primary)] dark:text-[var(--color-glass-dark-text-primary)]">Workspace Description</label>
              <textarea
                id="org-desc"
                rows={2}
                placeholder="Briefly describe the purpose of this client tenant workspace..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-[var(--radius-glass-md)] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors duration-120 shadow-sm resize-none"
              />
            </div>

            <div className="border-t border-[var(--color-glass-regular-border)] dark:border-[var(--color-glass-dark-regular-border)] pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)]">Invite Initial Members</h3>
                  <p className="text-[10px] text-[var(--color-glass-text-tertiary)] dark:text-[var(--color-glass-dark-text-tertiary)] mt-0.5">Invite teammates to join this tenant workspace immediately</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-all border border-blue-500/20"
                >
                  <Plus className="size-3.5" /> Add Row
                </button>
              </div>

              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {invitedMembers.map((m, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 flex-1">
                      <input
                        type="text"
                        placeholder="Teammate Full Name"
                        value={m.fullName}
                        onChange={(e) => handleMemberChange(idx, "fullName", e.target.value)}
                        className="h-8 rounded-[var(--radius-glass-md)] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                      <input
                        type="email"
                        placeholder="teammate@company.com"
                        value={m.email}
                        onChange={(e) => handleMemberChange(idx, "email", e.target.value)}
                        className="h-8 rounded-[var(--radius-glass-md)] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                      <select
                        value={m.roleId}
                        onChange={(e) => handleMemberChange(idx, "roleId", parseInt(e.target.value))}
                        className="h-8 rounded-[var(--radius-glass-md)] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-1.5 py-0.5 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      >
                        <option value={2}>Admin</option>
                        <option value={3}>Member</option>
                        <option value={4}>Viewer</option>
                      </select>
                    </div>
                    {invitedMembers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(idx)}
                        className="p-1.5 hover:bg-red-500/10 rounded-md text-red-500 hover:text-red-400 transition-colors"
                        title="Remove member invitation row"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-[var(--color-glass-regular-border)] dark:border-[var(--color-glass-dark-regular-border)] pt-6 flex justify-between items-center">
              <div className="text-[10px] text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)] flex items-center gap-1.5">
                <Shield className="size-3 text-emerald-500" /> Isolated Sandbox Env
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-[var(--radius-glass-md)] bg-blue-600 hover:bg-blue-700 px-6 py-2 text-sm font-bold text-white shadow transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin animate-float" /> Creating...
                  </>
                ) : (
                  <>
                    Create Workspace <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </div>
            
          </form>
        </GlassPanel>
      </div>
    </div>
  );
}

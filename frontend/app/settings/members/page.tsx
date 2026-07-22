"use client";

import React, { useEffect, useState } from "react";
import { useOrgStore } from "@/store/organization";
import {
  Users,
  UserPlus,
  Trash2,
  Shield,
  Mail,
  CheckCircle2,
  Copy,
  ExternalLink,
  X,
  FileText,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Member {
  id: number;
  joined_at: string;
  status: string;
  invite_token?: string;
  user: {
    id: number;
    email: string;
    full_name: string;
  };
  role: {
    id: number;
    name: string;
  };
}

interface InviteEmailPreview {
  email: string;
  roleName: string;
  roleId: number;
  inviteToken: string;
  inviteLink: string;
  subject: string;
  body: string;
}

export default function MembersSettingsPage() {
  const { currentOrg } = useOrgStore();
  const queryClient = useQueryClient();
  const [emailInput, setEmailInput] = useState("");
  const [roleInput, setRoleInput] = useState("2"); // Default Admin
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [emailPreviewModal, setEmailPreviewModal] = useState<InviteEmailPreview | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const { data: fetchedMembers, isLoading: loading } = useQuery<Member[]>({
    queryKey: ["orgMembers", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      let apiMembers: Member[] = [];
      try {
        const res = await fetch(`/api/memberships/organization/${currentOrg.id}`);
        if (res.ok) {
          apiMembers = await res.json();
        }
      } catch (e) {}
      let localMembers: Member[] = [];
      if (typeof window !== "undefined") {
        try {
          localMembers = JSON.parse(localStorage.getItem(`forgeflow_custom_members_${currentOrg.id}`) || "[]");
        } catch (e) {}
      }
      const map = new Map<number, Member>();
      apiMembers.forEach(m => map.set(m.id, m));
      localMembers.forEach(m => {
        if (!map.has(m.id)) map.set(m.id, m);
      });
      return Array.from(map.values());
    },
    enabled: !!currentOrg?.id,
  });

  const members = fetchedMembers || [];

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !emailInput) return;
    setMessage(null);
    try {
      const res = await fetch("/api/memberships/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput,
          organization_id: currentOrg.id,
          role_id: parseInt(roleInput),
        }),
      });
      if (res.ok) {
        const data = await res.json();

        const roleName = data.role?.name || (roleInput === "1" ? "Owner" : roleInput === "2" ? "Admin" : "Member");
        const token = data.invite_token || `inv_${Date.now()}`;
        const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3001";
        const link = `${baseUrl}/accept-invite?token=${token}&email=${encodeURIComponent(emailInput)}&role=${encodeURIComponent(roleName)}&role_id=${roleInput}&org=${encodeURIComponent(currentOrg.name)}&org_id=${currentOrg.id}`;

        const subjectStr = `Invitation to join ${currentOrg.name} on ForgeFlow as ${roleName}`;
        const bodyStr = `Hello ${emailInput.split("@")[0]},\n\nYou have been invited to join ${currentOrg.name} on ForgeFlow with the role of "${roleName}".\n\nTo accept this invitation and review your assigned permissions, click the link below:\n${link}\n\nWelcome aboard!\nThe ${currentOrg.name} Team`;

        setEmailPreviewModal({
          email: emailInput,
          roleName,
          roleId: parseInt(roleInput),
          inviteToken: token,
          inviteLink: link,
          subject: subjectStr,
          body: bodyStr,
        });

        // Persist to local storage if custom org
        try {
          const newMem: Member = {
            id: data.id || Date.now(),
            joined_at: new Date().toISOString(),
            status: "invited",
            user: { id: Date.now(), email: emailInput, full_name: emailInput.split("@")[0] },
            role: { id: parseInt(roleInput), name: roleName },
          };
          const existing = JSON.parse(localStorage.getItem(`forgeflow_custom_members_${currentOrg.id}`) || "[]");
          localStorage.setItem(`forgeflow_custom_members_${currentOrg.id}`, JSON.stringify([...existing, newMem]));
        } catch (e) {}

        setEmailInput("");
        setMessage({
          type: "success",
          text: `Invitation generated & auto-email draft ready for ${emailInput}!`,
        });

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["orgMembers", currentOrg.id] }),
          queryClient.invalidateQueries({ queryKey: ["activityLogs", currentOrg.id] }),
        ]);
      } else {
        const data = await res.json();
        setMessage({
          type: "error",
          text: data.detail || "Failed to send invitation",
        });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Network error occurred." });
    }
  };

  const handleRemove = async (memId: number) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    try {
      await fetch(`/api/memberships/${memId}`, {
        method: "DELETE",
      });
      if (currentOrg) {
        try {
          const existing: Member[] = JSON.parse(localStorage.getItem(`forgeflow_custom_members_${currentOrg.id}`) || "[]");
          const updated = existing.filter(m => m.id !== memId);
          localStorage.setItem(`forgeflow_custom_members_${currentOrg.id}`, JSON.stringify(updated));
        } catch (e) {}

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["orgMembers", currentOrg.id] }),
          queryClient.invalidateQueries({ queryKey: ["activityLogs", currentOrg.id] }),
        ]);
      }
    } catch (err) {
      console.error("Error removing member:", err);
    }
  };

  const handleRoleChange = async (memId: number, newRoleId: number) => {
    try {
      await fetch(`/api/memberships/${memId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role_id: newRoleId }),
      });
      if (currentOrg) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["orgMembers", currentOrg.id] }),
          queryClient.invalidateQueries({ queryKey: ["activityLogs", currentOrg.id] }),
        ]);
      }
    } catch (err) {
      console.error("Error changing role:", err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!currentOrg) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="size-12 text-muted-foreground mb-4 animate-pulse" />
        <h3 className="text-lg font-semibold">Select an organization first</h3>
        <p className="text-sm text-muted-foreground">
          Choose a tenant from the dropdown in the header to load members.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">
          Members & Invitations
        </h2>
        <p className="text-sm text-muted-foreground">
          Manage user invitations, access levels, and active memberships for{" "}
          {currentOrg.name}.
        </p>
      </div>

      {/* Form: Invite Member */}
      <div className="rounded-xl border border-border bg-card/40 p-6 shadow-sm">
        <h3 className="text-sm font-semibold mb-4 text-foreground">Invite New Team Member</h3>
        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Mail className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <input
              type="email"
              required
              placeholder="user@example.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            />
          </div>
          <select
            value={roleInput}
            onChange={(e) => setRoleInput(e.target.value)}
            className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          >
            <option value="2">Admin</option>
            <option value="3">Member</option>
            <option value="4">Viewer</option>
          </select>
          <button
            type="submit"
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <UserPlus size={16} />
            <span>Send Invitation</span>
          </button>
        </form>

        {message && (
          <div
            className={cn(
              "mt-4 p-3 rounded-lg text-sm flex items-center gap-2 border",
              message.type === "success"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
            )}
          >
            {message.type === "success" ? <CheckCircle2 size={16} /> : <X size={16} />}
            <span>{message.text}</span>
          </div>
        )}
      </div>

      {/* Auto Email Writer & Embedded Link Provider Modal */}
      {emailPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border text-card-foreground rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Send size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Auto Email & Invitation Link Writer</h3>
                  <p className="text-xs text-muted-foreground">Embedded invitation link generated for {emailPreviewModal.email}</p>
                </div>
              </div>
              <button
                onClick={() => setEmailPreviewModal(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-foreground text-sm max-h-[70vh] overflow-y-auto">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">To</label>
                <input
                  readOnly
                  value={emailPreviewModal.email}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Subject</label>
                <input
                  readOnly
                  value={emailPreviewModal.subject}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Email Body Draft</label>
                <textarea
                  readOnly
                  rows={6}
                  value={emailPreviewModal.body}
                  className="w-full p-3 bg-background border border-border rounded-lg text-xs font-mono text-foreground leading-relaxed"
                />
              </div>

              {/* Embedded Link Provider Section */}
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">Embedded Redirect Link</span>
                  <span className="text-[11px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">Role: {emailPreviewModal.roleName}</span>
                </div>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={emailPreviewModal.inviteLink}
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-xs font-mono text-primary select-all"
                  />
                  <button
                    onClick={() => copyToClipboard(emailPreviewModal.inviteLink)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium rounded-lg transition-colors shrink-0"
                  >
                    <Copy size={14} />
                    <span>{copiedLink ? "Copied!" : "Copy Link"}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border bg-muted/40 flex items-center justify-between">
              <button
                onClick={() => setEmailPreviewModal(null)}
                className="px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-xs font-medium rounded-lg transition-colors"
              >
                Close Preview
              </button>
              <a
                href={emailPreviewModal.inviteLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors"
              >
                <span>Simulate Opening Invitation Link</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Members Table */}
      <div className="rounded-xl border border-border bg-card/40 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-foreground">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground border-b border-border font-semibold">
            <tr>
              <th className="p-4">User</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status</th>
              <th className="p-4">Joined</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {members.map((mem) => (
              <tr key={mem.id} className="hover:bg-muted/30 transition-colors">
                <td className="p-4">
                  <div className="font-medium text-foreground">{mem.user.full_name || mem.user.email.split("@")[0]}</div>
                  <div className="text-xs text-muted-foreground">{mem.user.email}</div>
                </td>
                <td className="p-4">
                  <select
                    value={mem.role.id}
                    onChange={(e) => handleRoleChange(mem.id, parseInt(e.target.value))}
                    className="bg-background border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="1">Owner</option>
                    <option value="2">Admin</option>
                    <option value="3">Member</option>
                    <option value="4">Viewer</option>
                  </select>
                </td>
                <td className="p-4">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium border",
                      mem.status === "active"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                    )}
                  >
                    {mem.status}
                  </span>
                </td>
                <td className="p-4 text-xs text-muted-foreground">
                  {new Date(mem.joined_at).toLocaleDateString()}
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => handleRemove(mem.id)}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

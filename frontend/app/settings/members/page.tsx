"use client";

import React, { useState } from "react";
import { useOrg } from "@/hooks/use-org";
import { useOrgMembers } from "@/hooks/use-org-members";
import { Users, UserPlus, Mail } from "lucide-react";
import { MembersTable } from "./components/MembersTable";
import { InviteMemberModal, type InviteEmailPreview } from "./components/InviteMemberModal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { isApiError } from "@/lib/errors";
import toast from "react-hot-toast";

export default function MembersSettingsPage() {
  const { orgId, orgName, isOrgLoaded } = useOrg();
  const queryClient = useQueryClient();
  const { members, isLoading, inviteMember } = useOrgMembers();

  const [emailInput, setEmailInput] = useState("");
  const [roleInput, setRoleInput] = useState("2");
  const [emailPreviewModal, setEmailPreviewModal] = useState<InviteEmailPreview | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const removeMemberMutation = useMutation({
    mutationFn: async (memId: number) => {
      await fetch(`/api/memberships/${memId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("Member removed");
    },
    onError: (err) => {
      toast.error(isApiError(err) ? err.displayMessage : "Failed to remove member");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orgMembers(orgId) });
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ memId, newRoleId }: { memId: number; newRoleId: number }) => {
      await fetch(`/api/memberships/${memId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role_id: newRoleId }),
      });
    },
    onSuccess: () => {
      toast.success("Role updated");
    },
    onError: (err) => {
      toast.error(isApiError(err) ? err.displayMessage : "Failed to update role");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orgMembers(orgId) });
    },
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !emailInput) return;
    const roleId = parseInt(roleInput);
    const roleName = roleId === 1 ? "Owner" : roleId === 2 ? "Admin" : "Member";

    inviteMember.mutate(
      { email: emailInput, role_id: roleId },
      {
        onSuccess: (data) => {
          const token = data.invite_token || `inv_${Date.now()}`;
          const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
          const link = `${baseUrl}/accept-invite?token=${token}&email=${encodeURIComponent(emailInput)}&role=${encodeURIComponent(roleName)}&role_id=${roleId}&org=${encodeURIComponent(orgName || "Org")}&org_id=${orgId}`;
          
          setEmailPreviewModal({
            email: emailInput,
            roleName,
            roleId,
            inviteToken: token,
            inviteLink: link,
            subject: `Invitation to join ${orgName} on ForgeFlow as ${roleName}`,
            body: `Hello ${emailInput.split("@")[0]},\n\nYou have been invited to join ${orgName} on ForgeFlow with the role of "${roleName}".\n\nTo accept this invitation, click:\n${link}`,
          });
          setEmailInput("");
        },
      }
    );
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!isOrgLoaded) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="size-12 text-muted-foreground mb-4 animate-pulse" />
        <h3 className="text-lg font-semibold">Select an organization first</h3>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Members & Invitations</h2>
        <p className="text-sm text-muted-foreground">Manage user invitations and access for {orgName}.</p>
      </div>

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
              className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={roleInput}
            onChange={(e) => setRoleInput(e.target.value)}
            className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="2">Admin</option>
            <option value="3">Member</option>
            <option value="4">Viewer</option>
          </select>
          <button
            type="submit"
            disabled={inviteMember.isPending}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            <UserPlus size={16} />
            <span>Send Invitation</span>
          </button>
        </form>
      </div>

      <MembersTable
        members={members}
        loading={isLoading}
        onRemove={(id) => removeMemberMutation.mutate(id)}
        onRoleChange={(id, roleId) => changeRoleMutation.mutate({ memId: id, newRoleId: roleId })}
      />

      <InviteMemberModal
        preview={emailPreviewModal}
        copiedLink={copiedLink}
        onClose={() => setEmailPreviewModal(null)}
        onCopy={handleCopy}
      />
    </div>
  );
}

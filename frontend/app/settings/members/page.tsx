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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Member {
  id: number;
  joined_at: string;
  status: string;
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

export default function MembersSettingsPage() {
  const { currentOrg } = useOrgStore();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailInput, setEmailInput] = useState("");
  const [roleInput, setRoleInput] = useState("4");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    async function loadMembers() {
      if (!currentOrg) return;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/memberships/organization/${currentOrg.id}`,
        );
        if (res.ok) {
          const data = await res.json();
          setMembers(data);
        }
      } catch (err) {
        console.error("Error loading members:", err);
      } finally {
        setLoading(false);
      }
    }

    loadMembers();
    window.addEventListener("orgChanged", loadMembers);
    return () => window.removeEventListener("orgChanged", loadMembers);
  }, [currentOrg]);

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
        setMembers([...members, data]);
        setEmailInput("");
        setMessage({
          type: "success",
          text: `Successfully invited ${emailInput}!`,
        });
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
      const res = await fetch(`/api/memberships/${memId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMembers(members.filter((m) => m.id !== memId));
      }
    } catch (err) {
      console.error("Error removing member:", err);
    }
  };

  const handleRoleChange = async (memId: number, newRoleId: number) => {
    try {
      const res = await fetch(`/api/memberships/${memId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role_id: newRoleId }),
      });
      if (res.ok) {
        const updated = await res.json();
        setMembers(members.map((m) => (m.id === memId ? updated : m)));
      }
    } catch (err) {
      console.error("Error changing role:", err);
    }
  };

  if (!currentOrg) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="size-12 text-muted-foreground mb-4 animate-pulse" />
        <h3 className="text-lg font-semibold">Select an organization first</h3>
        <p className="text-sm text-muted-foreground">
          Choose a tenant from the dropdown in the header header to load
          members.
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

      {}
      <form
        onSubmit={handleInvite}
        className="bg-background/40 border border-border p-4 rounded-lg flex flex-col md:flex-row gap-3 items-end"
      >
        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold text-muted-foreground mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="user@example.com"
              required
              className="w-full bg-background/60 border border-border rounded-lg pl-9 pr-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
        <div className="w-full md:w-48">
          <label className="block text-xs font-semibold text-muted-foreground mb-1">
            Role Type
          </label>
          <select
            value={roleInput}
            onChange={(e) => setRoleInput(e.target.value)}
            className="w-full bg-background/60 border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="2">Admin</option>
            <option value="3">Manager</option>
            <option value="4">Member</option>
            <option value="5">Client</option>
            <option value="6">Viewer</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-foreground text-background hover:bg-foreground/90 px-4 py-1.5 text-sm font-semibold transition-colors shrink-0"
        >
          <UserPlus className="size-4" />
          <span>Send Invitation</span>
        </button>
      </form>

      {message && (
        <div
          className={cn(
            "px-4 py-2 text-xs rounded-lg border",
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
              : "bg-destructive/10 border-destructive/20 text-destructive",
          )}
        >
          {message.text}
        </div>
      )}

      {}
      <div className="border border-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            <div className="h-6 w-1/4 bg-muted animate-pulse rounded" />
            <div className="h-10 w-full bg-muted animate-pulse rounded" />
            <div className="h-10 w-full bg-muted animate-pulse rounded" />
          </div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="size-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No members found. Send an invitation above to start building your
              team.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
              <tr>
                <th className="px-4 py-2.5">User</th>
                <th className="px-4 py-2.5">Role</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Joined</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-foreground">
                      {member.user.full_name || "Invited User"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {member.user.email}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={member.role.id}
                      onChange={(e) =>
                        handleRoleChange(member.id, parseInt(e.target.value))
                      }
                      className="bg-background border border-border rounded px-2 py-0.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="1">Owner</option>
                      <option value="2">Admin</option>
                      <option value="3">Manager</option>
                      <option value="4">Member</option>
                      <option value="5">Client</option>
                      <option value="6">Viewer</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                        member.status === "active"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : member.status === "invited"
                            ? "bg-amber-500/10 text-amber-500 animate-pulse"
                            : "bg-destructive/10 text-destructive",
                      )}
                    >
                      {member.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(member.joined_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleRemove(member.id)}
                      className="text-destructive hover:text-destructive/80 transition-colors p-1"
                      title="Remove Member"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

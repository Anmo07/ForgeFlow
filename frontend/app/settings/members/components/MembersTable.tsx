"use client";

import React from "react";
import { Users, Trash2, Shield, Mail } from "lucide-react";
import type { Membership } from "@/types";

interface MembersTableProps {
  members: Membership[];
  loading: boolean;
  onRemove: (memId: number) => void;
  onRoleChange: (memId: number, newRoleId: number) => void;
}

export function MembersTable({
  members,
  loading,
  onRemove,
  onRoleChange,
}: MembersTableProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground animate-pulse">
        Loading organization members...
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        No active members found. Invite your team to collaborate.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Users className="size-4 text-primary" />
          <span>Active Organization Members ({members.length})</span>
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-foreground">
          <thead className="bg-muted/40 text-xs font-semibold uppercase text-muted-foreground border-b border-border">
            <tr>
              <th className="px-6 py-3">Member</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Joined</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {members.map((member) => {
              const email = member.user?.email || member.user_email || "User";
              const name = member.user?.full_name || member.user_name || email.split("@")[0];
              const roleName = member.role?.name || member.role_name || "Member";
              const roleId = member.role?.id || member.role_id || 2;

              return (
                <tr key={member.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                        {name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="size-3" />
                          <span>{email}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={roleId}
                      onChange={(e) => onRoleChange(member.id, parseInt(e.target.value))}
                      className="px-2.5 py-1 bg-background border border-border rounded-md text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value={1}>Owner / Admin</option>
                      <option value={2}>Admin</option>
                      <option value={3}>Member</option>
                      <option value={4}>Viewer</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        member.status === "active"
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                      }`}
                    >
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">
                    {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : "Recently"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onRemove(member.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                      title="Remove member"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

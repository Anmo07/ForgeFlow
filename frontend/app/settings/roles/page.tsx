"use client";

import React, { useEffect, useState } from "react";
import { useOrgStore } from "@/store/organization";
import { Shield, ShieldAlert, Plus, Check, Edit3, Trash2, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

interface Permission {
  id: number;
  name: string;
  description: string;
}

interface Role {
  id: number;
  name: string;
  description: string;
  is_system: boolean;
  permissions: Permission[];
}

interface AffectedMember {
  email: string;
  full_name: string | null;
}

export default function RolesSettingsPage() {
  const { currentOrg } = useOrgStore();
  const queryClient = useQueryClient();

  const activeOrgId = currentOrg?.id || 1;

  // Form states
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const [selectedPerms, setSelectedPerms] = useState<number[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [affectedMembers, setAffectedMembers] = useState<AffectedMember[]>([]);

  const { data: fetchedRoles, isLoading: loadingRoles } = useQuery<Role[]>({
    queryKey: queryKeys.orgRoles(activeOrgId),
    queryFn: async () => {
      if (!currentOrg) return [];
      let apiRoles: Role[] = [];
      try {
        const res = await fetch(`/api/roles/organization/${currentOrg.id}`);
        if (res.ok) apiRoles = await res.json();
      } catch (e) {}
      let localRoles: Role[] = [];
      if (typeof window !== "undefined") {
        try {
          localRoles = JSON.parse(localStorage.getItem(`forgeflow_custom_roles_${currentOrg.id}`) || "[]");
        } catch (e) {}
      }
      const map = new Map<number, Role>();
      apiRoles.forEach(r => map.set(r.id, r));
      localRoles.forEach(r => {
        if (!map.has(r.id)) map.set(r.id, r);
      });
      return Array.from(map.values());
    },
    enabled: !!currentOrg?.id,
  });

  const { data: fetchedPerms, isLoading: loadingPerms } = useQuery<Permission[]>({
    queryKey: queryKeys.orgPermissions(),
    queryFn: async () => {
      try {
        const res = await fetch("/api/permissions/");
        if (res.ok) return res.json();
      } catch (e) {}
      return [];
    },
  });

  const roles = fetchedRoles || [];
  const permissions = fetchedPerms || [];
  const loading = loadingRoles || loadingPerms;

  const handleTogglePerm = (permId: number) => {
    if (selectedPerms.includes(permId)) {
      setSelectedPerms(selectedPerms.filter((id) => id !== permId));
    } else {
      setSelectedPerms([...selectedPerms, permId]);
    }
  };

  const startEdit = (role: Role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDesc(role.description || "");
    setSelectedPerms(role.permissions.map((p) => p.id));
    setErrorMsg("");
    setAffectedMembers([]);
  };

  const cancelEdit = () => {
    setEditingRole(null);
    setRoleName("");
    setRoleDesc("");
    setSelectedPerms([]);
    setErrorMsg("");
    setAffectedMembers([]);
  };

  const submitRoleMutation = useMutation({
    mutationFn: async (payload: { name: string; description: string; permission_ids: number[] }) => {
      if (!currentOrg) throw new Error("No organization selected");
      let res: Response;
      if (editingRole) {
        res = await fetch(`/api/organizations/${currentOrg.id}/roles/${editingRole.id}`, {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            "X-Organization-ID": String(currentOrg.id)
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/organizations/${currentOrg.id}/roles`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "X-Organization-ID": String(currentOrg.id)
          },
          body: JSON.stringify(payload),
        });
      }
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to process role");
      }
      return res.json();
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.orgRoles(activeOrgId) });
      const previous = queryClient.getQueryData<Role[]>(queryKeys.orgRoles(activeOrgId));
      if (previous) {
        const mappedPerms = payload.permission_ids.map((id) => {
          const found = permissions.find((p) => p.id === id);
          return found || { id, name: `scope.${id}`, description: `Assigned scope #${id}` };
        });

        let updatedRoles = [...previous];
        if (editingRole) {
          updatedRoles = updatedRoles.map((r) =>
            r.id === editingRole.id
              ? { ...r, name: payload.name, description: payload.description, permissions: mappedPerms }
              : r
          );
        } else {
          updatedRoles.push({
            id: Date.now(),
            name: payload.name,
            description: payload.description,
            is_system: false,
            permissions: mappedPerms,
          });
        }
        queryClient.setQueryData<Role[]>(queryKeys.orgRoles(activeOrgId), updatedRoles);
      }
      return { previous };
    },
    onError: (err: Error) => {
      setErrorMsg(err.message || "Network error occurred.");
    },
    onSuccess: () => {
      cancelEdit();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orgRoles(activeOrgId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orgMembers(activeOrgId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orgAuditLogs(activeOrgId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardActivity(activeOrgId) });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !roleName) return;
    setErrorMsg("");
    setAffectedMembers([]);
    submitRoleMutation.mutate({
      name: roleName,
      description: roleDesc,
      permission_ids: selectedPerms,
    });
  };

  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: number) => {
      if (!currentOrg) return;
      const res = await fetch(`/api/organizations/${currentOrg.id}/roles/${roleId}`, {
        method: "DELETE",
        headers: {
          "X-Organization-ID": String(currentOrg.id)
        }
      });
      if (!res.ok) {
        const data = await res.json();
        if (res.status === 409) {
          const err = new Error(data.detail?.message || "Cannot delete role. It is assigned to active members.");
          (err as any).affected_members = data.detail?.affected_members || [];
          throw err;
        }
        throw new Error(data.detail || "Failed to delete role.");
      }
    },
    onMutate: async (roleId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.orgRoles(activeOrgId) });
      const previous = queryClient.getQueryData<Role[]>(queryKeys.orgRoles(activeOrgId));
      queryClient.setQueryData<Role[]>(queryKeys.orgRoles(activeOrgId), (old) =>
        old?.filter((r) => r.id !== roleId) ?? []
      );
      return { previous };
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Network error occurred on delete.");
      if (err.affected_members) {
        setAffectedMembers(err.affected_members);
      }
    },
    onSuccess: (_, roleId) => {
      if (editingRole?.id === roleId) {
        cancelEdit();
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orgRoles(activeOrgId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orgMembers(activeOrgId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orgAuditLogs(activeOrgId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardActivity(activeOrgId) });
    },
  });

  const handleDelete = (roleId: number) => {
    if (!currentOrg) return;
    if (!window.confirm("Are you sure you want to delete this custom role?")) return;
    setErrorMsg("");
    setAffectedMembers([]);
    deleteRoleMutation.mutate(roleId);
  };

  if (!currentOrg) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Shield className="size-12 text-muted-foreground mb-4 animate-pulse" />
        <h3 className="text-lg font-semibold">Select an organization first</h3>
        <p className="text-sm text-muted-foreground">
          Choose a tenant from the dropdown in the header to load roles.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl font-bold text-foreground">
          Roles & Access Scopes
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Define and map custom roles and database scopes for your organization members.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Active Roles Panel */}
        <div className="xl:col-span-2 space-y-4">
          <h3 className="text-md font-bold text-foreground flex items-center gap-2">
            <Shield className="size-4 text-blue-500" />
            <span>Active Roles</span>
          </h3>

          {loading ? (
            <div className="space-y-3">
              <div className="h-24 w-full bg-muted animate-pulse rounded-lg" />
              <div className="h-24 w-full bg-muted animate-pulse rounded-lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className="bg-background/40 border border-border p-4 rounded-xl flex flex-col justify-between hover:border-primary/30 transition-all shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-foreground text-sm">
                        {role.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <span
                          className={cn(
                            "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded",
                            role.is_system
                              ? "bg-blue-500/10 text-blue-500"
                              : "bg-purple-500/10 text-purple-500",
                          )}
                        >
                          {role.is_system ? "System" : "Custom"}
                        </span>
                        {!role.is_system && (
                          <div className="flex items-center gap-1 ml-1.5">
                            <button
                              onClick={() => startEdit(role)}
                              className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                              title="Edit Role"
                            >
                              <Edit3 className="size-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(role.id)}
                              className="p-1 hover:bg-red-500/10 rounded text-muted-foreground hover:text-destructive transition-colors"
                              title="Delete Role"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                      {role.description}
                    </p>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-muted-foreground mb-1.5">
                      Permissions ({role.permissions.length}):
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.map((p) => (
                        <span
                          key={p.id}
                          className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-foreground font-medium"
                        >
                          {p.name}
                        </span>
                      ))}
                      {role.permissions.length === 0 && (
                        <span className="text-[10px] text-muted-foreground italic">
                          No scopes assigned
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create / Edit Role Panel */}
        <div className="bg-background/20 border border-border p-5 rounded-xl space-y-4 shadow-sm h-fit">
          <h3 className="text-md font-bold text-foreground flex items-center gap-2">
            {editingRole ? (
              <>
                <Edit3 className="size-4 text-purple-500" />
                <span>Edit Custom Role</span>
              </>
            ) : (
              <>
                <Plus className="size-4 text-blue-500" />
                <span>Create Custom Role</span>
              </>
            )}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Role Name
              </label>
              <input
                type="text"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="e.g. Sales Specialist"
                required
                className="w-full bg-background/60 border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Description
              </label>
              <textarea
                value={roleDesc}
                onChange={(e) => setRoleDesc(e.target.value)}
                placeholder="Brief description of the role's access..."
                rows={2}
                className="w-full bg-background/60 border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2">
                Assign Permissions
              </label>
              <div className="max-h-48 overflow-y-auto border border-border rounded-lg bg-background/40 p-2 space-y-1.5">
                {permissions.map((perm) => {
                  const isChecked = selectedPerms.includes(perm.id);
                  return (
                    <button
                      key={perm.id}
                      type="button"
                      onClick={() => handleTogglePerm(perm.id)}
                      className={cn(
                        "w-full flex items-center justify-between text-left text-xs p-2 rounded-lg transition-all",
                        isChecked
                          ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                          : "hover:bg-muted/60 border border-transparent",
                      )}
                    >
                      <div>
                        <div>{perm.name}</div>
                        <div className="text-[10px] text-muted-foreground font-normal mt-0.5">
                          {perm.description}
                        </div>
                      </div>
                      {isChecked && <Check className="size-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {errorMsg && (
              <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-lg flex flex-col gap-2">
                <div className="flex items-center gap-1.5 font-semibold">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
                {affectedMembers.length > 0 && (
                  <div className="mt-1 pl-5 list-disc space-y-1">
                    <div className="font-semibold text-[10px] uppercase text-muted-foreground">Affected active members:</div>
                    {affectedMembers.map((m, idx) => (
                      <div key={idx} className="text-[11px] font-mono">
                        • {m.full_name || m.email} ({m.email})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              {editingRole && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-border hover:bg-muted px-4 py-1.5 text-sm font-semibold transition-colors"
                >
                  <X className="size-4" />
                  <span>Cancel</span>
                </button>
              )}
              <button
                type="submit"
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-foreground text-background hover:bg-foreground/90 px-4 py-1.5 text-sm font-semibold transition-colors"
              >
                <span>{editingRole ? "Update Role" : "Generate Role"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

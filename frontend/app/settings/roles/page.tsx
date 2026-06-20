"use client";

import React, { useEffect, useState } from "react";
import { useOrgStore } from "@/store/organization";
import { Shield, ShieldAlert, Plus, Check, Info } from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function RolesSettingsPage() {
  const { currentOrg } = useOrgStore();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [selectedPerms, setSelectedPerms] = useState<number[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function loadData() {
      if (!currentOrg) return;
      setLoading(true);
      try {
        const [rolesRes, permsRes] = await Promise.all([
          fetch(`/api/roles/organization/${currentOrg.id}`),
          fetch("/api/permissions/"),
        ]);

        if (rolesRes.ok && permsRes.ok) {
          const rolesData = await rolesRes.json();
          const permsData = await permsRes.json();
          setRoles(rolesData);
          setPermissions(permsData);
        }
      } catch (err) {
        console.error("Error loading roles/permissions data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
    window.addEventListener("orgChanged", loadData);
    return () => window.removeEventListener("orgChanged", loadData);
  }, [currentOrg]);

  const handleTogglePerm = (permId: number) => {
    if (selectedPerms.includes(permId)) {
      setSelectedPerms(selectedPerms.filter((id) => id !== permId));
    } else {
      setSelectedPerms([...selectedPerms, permId]);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !newRoleName) return;
    setErrorMsg("");

    try {
      const res = await fetch("/api/roles/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRoleName,
          description: newRoleDesc,
          organization_id: currentOrg.id,
          permission_ids: selectedPerms,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setRoles([...roles, data]);
        setNewRoleName("");
        setNewRoleDesc("");
        setSelectedPerms([]);
      } else {
        const data = await res.json();
        setErrorMsg(data.detail || "Failed to create custom role");
      }
    } catch (err) {
      setErrorMsg("Network error occurred.");
    }
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
        <p className="text-sm text-muted-foreground">
          Define and map custom roles and database scopes for your organization
          members.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {}
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
                  className="bg-background/40 border border-border p-4 rounded-lg flex flex-col justify-between hover:border-blue-500/30 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-foreground">
                        {role.name}
                      </span>
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
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
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
                          className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-foreground"
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

        {}
        <div className="bg-background/20 border border-border p-4 rounded-xl space-y-4">
          <h3 className="text-md font-bold text-foreground flex items-center gap-2">
            <Plus className="size-4 text-blue-500" />
            <span>Create Custom Role</span>
          </h3>

          <form onSubmit={handleCreateRole} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Role Name
              </label>
              <input
                type="text"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="e.g. Sales Specialist"
                required
                className="w-full bg-background/60 border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Description
              </label>
              <textarea
                value={newRoleDesc}
                onChange={(e) => setNewRoleDesc(e.target.value)}
                placeholder="Brief description of the role's access..."
                rows={2}
                className="w-full bg-background/60 border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
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
                        "w-full flex items-center justify-between text-left text-xs p-1.5 rounded transition-colors",
                        isChecked
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted",
                      )}
                    >
                      <div>
                        <div className="font-semibold">{perm.name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {perm.description}
                        </div>
                      </div>
                      {isChecked && <Check className="size-3.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {errorMsg && (
              <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 p-2 rounded">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-foreground text-background hover:bg-foreground/90 px-4 py-1.5 text-sm font-semibold transition-colors"
            >
              <span>Generate Role</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

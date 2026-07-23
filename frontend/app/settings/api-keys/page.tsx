"use client";

import React, { useEffect, useState } from "react";
import { useOrgStore } from "@/store/organization";
import {
  Key,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

interface APIKey {
  id: number;
  organization_id: number;
  name: string;
  key_prefix: string;
  permissions: string[];
  created_by: number;
  expires_at: string | null;
  last_used: string | null;
  revoked: boolean;
}

export default function ApiKeysSettingsPage() {
  const { currentOrg } = useOrgStore();
  const queryClient = useQueryClient();
  const activeOrgId = currentOrg?.id || 1;

  const [keyName, setKeyName] = useState("");
  const [scopes, setScopes] = useState<string[]>(["project:view"]);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const availableScopes = [
    "project:create",
    "project:update",
    "project:delete",
    "project:view",
    "client:create",
    "client:update",
    "client:delete",
    "invoice:create",
    "invoice:view",
    "invoice:delete",
    "user:invite",
    "user:remove",
    "settings:update",
    "analytics:view",
  ];

  const { data: fetchedKeys, isLoading: loading } = useQuery<APIKey[]>({
    queryKey: queryKeys.orgApiKeys(activeOrgId),
    queryFn: async () => {
      if (!currentOrg) return [];
      try {
        const res = await fetch(`/api/api-keys/organization/${currentOrg.id}`);
        if (res.ok) return res.json();
      } catch (e) {}
      return [];
    },
    enabled: !!currentOrg?.id,
  });

  const keys = fetchedKeys || [];

  const createKeyMutation = useMutation({
    mutationFn: async (payload: { name: string; permissions: string[] }) => {
      const res = await fetch("/api/api-keys/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: payload.name,
          organization_id: currentOrg?.id || 1,
          permissions: payload.permissions,
          mode: "live",
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to generate API Key");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedKey(data.plain_key || data.token || data.key_prefix || "ff_live_key");
      setKeyName("");
    },
    onError: (err: Error) => {
      setErrorMsg(err.message || "Network error occurred.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orgApiKeys(activeOrgId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orgAuditLogs(activeOrgId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardActivity(activeOrgId) });
    },
  });

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !keyName) return;
    setErrorMsg("");
    setGeneratedKey(null);
    createKeyMutation.mutate({ name: keyName, permissions: scopes });
  };

  const revokeKeyMutation = useMutation({
    mutationFn: async (keyId: number) => {
      const res = await fetch(`/api/api-keys/${keyId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to revoke API key");
    },
    onMutate: async (keyId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.orgApiKeys(activeOrgId) });
      const previous = queryClient.getQueryData<APIKey[]>(queryKeys.orgApiKeys(activeOrgId));
      queryClient.setQueryData<APIKey[]>(queryKeys.orgApiKeys(activeOrgId), (old) =>
        old?.map((k) => (k.id === keyId ? { ...k, revoked: true } : k)) ?? []
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.orgApiKeys(activeOrgId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orgApiKeys(activeOrgId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orgAuditLogs(activeOrgId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardActivity(activeOrgId) });
    },
  });

  const handleRevoke = (keyId: number) => {
    if (!confirm("Are you sure you want to revoke this API key? This cannot be undone.")) return;
    revokeKeyMutation.mutate(keyId);
  };

  const rotateKeyMutation = useMutation({
    mutationFn: async (keyId: number) => {
      const res = await fetch(`/api/api-keys/${keyId}/rotate`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to rotate key");
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedKey(data.plain_key || data.token || data.key_prefix);
    },
    onError: (err: Error) => {
      setErrorMsg(err.message || "Error rotating key");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orgApiKeys(activeOrgId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orgAuditLogs(activeOrgId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardActivity(activeOrgId) });
    },
  });

  const handleRotate = (keyId: number) => {
    if (!confirm("Are you sure you want to rotate this key? Any systems using the old key will stop working immediately.")) return;
    setErrorMsg("");
    setGeneratedKey(null);
    rotateKeyMutation.mutate(keyId);
  };

  const handleCopy = () => {
    if (!generatedKey) return;
    navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleScope = (scope: string) => {
    if (scopes.includes(scope)) {
      setScopes(scopes.filter((s) => s !== scope));
    } else {
      setScopes([...scopes, scope]);
    }
  };

  if (!currentOrg) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Key className="size-12 text-muted-foreground mb-4 animate-pulse" />
        <h3 className="text-lg font-semibold">Select an organization first</h3>
        <p className="text-sm text-muted-foreground">
          Choose a tenant from the dropdown in the header to load API keys.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">API Credentials</h2>
        <p className="text-sm text-muted-foreground">
          Integrate external developer apps and automate actions securely using
          key scopes.
        </p>
      </div>

      {}
      {generatedKey && (
        <div className="bg-blue-500/10 border-2 border-blue-500/30 p-5 rounded-lg space-y-3">
          <div className="flex items-center gap-2 text-blue-500 font-bold">
            <AlertCircle className="size-5" />
            <span>Copy your API Key now!</span>
          </div>
          <p className="text-xs text-muted-foreground">
            For security reasons, we will only show this secret credential once.
            Make sure to record it in a safe place, or you will have to
            rotate/regenerate it.
          </p>
          <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-2.5 rounded-lg font-mono text-sm break-all text-gray-900 dark:text-gray-100 select-all shadow-inner">
            <span className="flex-1">{generatedKey}</span>
            <button
              onClick={handleCopy}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors shrink-0"
            >
              {copied ? (
                <Check className="size-4 text-emerald-500" />
              ) : (
                <Copy className="size-4" />
              )}
            </button>
          </div>
          <button
            onClick={() => setGeneratedKey(null)}
            className="text-xs font-semibold underline text-blue-500 hover:text-blue-400"
          >
            I have saved the key securely
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {}
        <div className="xl:col-span-2 space-y-4">
          <h3 className="text-md font-bold text-foreground flex items-center gap-2">
            <Key className="size-4 text-blue-500" />
            <span>Access Keys</span>
          </h3>

          {loading ? (
            <div className="space-y-2">
              <div className="h-16 w-full bg-muted animate-pulse rounded-lg" />
              <div className="h-16 w-full bg-muted animate-pulse rounded-lg" />
            </div>
          ) : keys.length === 0 ? (
            <div className="p-8 border border-border rounded-lg text-center">
              <p className="text-sm text-muted-foreground">
                No active API keys found. Generate one to start connecting
                systems.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {keys.map((k) => (
                <div
                  key={k.id}
                  className={cn(
                    "border border-border p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-background/30",
                    k.revoked && "opacity-50",
                  )}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">
                        {k.name}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded",
                          k.revoked
                            ? "bg-muted text-muted-foreground"
                            : "bg-emerald-500/10 text-emerald-500",
                        )}
                      >
                        {k.revoked ? "Revoked" : "Active"}
                      </span>
                    </div>
                    <div className="font-mono text-xs text-muted-foreground mt-0.5">
                      Prefix: {k.key_prefix}••••••••
                    </div>
                    <div className="text-[10px] text-muted-foreground space-x-2 mt-1">
                      <span>
                        Last used:{" "}
                        {k.last_used
                          ? new Date(k.last_used).toLocaleString()
                          : "Never"}
                      </span>
                      <span>•</span>
                      <span>Scopes: {k.permissions.join(", ")}</span>
                    </div>
                  </div>
                  {!k.revoked && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleRotate(k.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border hover:bg-muted p-2 text-xs font-semibold transition-colors"
                        title="Rotate key (regenerate token)"
                      >
                        <RefreshCw className="size-3.5" />
                        <span className="hidden sm:inline">Rotate</span>
                      </button>
                      <button
                        onClick={() => handleRevoke(k.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border hover:bg-muted p-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                        title="Revoke key immediately"
                      >
                        <Trash2 className="size-3.5" />
                        <span className="hidden sm:inline">Revoke</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {}
        <div className="bg-background/20 border border-border p-4 rounded-xl space-y-4">
          <h3 className="text-md font-bold text-foreground">
            Generate API Key
          </h3>
          <form onSubmit={handleCreateKey} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Key Description Name
              </label>
              <input
                type="text"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="e.g. Jenkins CI/CD integration"
                required
                className="w-full bg-background/60 border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2">
                Scope Permissions
              </label>
              <div className="max-h-56 overflow-y-auto border border-border rounded-lg bg-background/40 p-2 space-y-1">
                {availableScopes.map((scope) => {
                  const isChecked = scopes.includes(scope);
                  return (
                    <label
                      key={scope}
                      className={cn(
                        "flex items-center gap-2 p-1.5 rounded text-xs cursor-pointer select-none transition-colors",
                        isChecked
                          ? "bg-primary/5 text-foreground"
                          : "hover:bg-muted/40 text-muted-foreground",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleScope(scope)}
                        className="rounded border-border"
                      />
                      <span>{scope}</span>
                    </label>
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
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-foreground text-background hover:bg-foreground/90 px-4 py-2 text-sm font-semibold transition-colors"
            >
              <span>Generate Key Credentials</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

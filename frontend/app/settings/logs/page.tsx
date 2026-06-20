"use client";

import React, { useEffect, useState } from "react";
import { useOrgStore } from "@/store/organization";
import { FileText, Globe, User, Terminal, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityLog {
  id: number;
  organization_id: number;
  user_id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  metadata_json: {
    ip?: string;
    details?: string;
  } | null;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export default function LogsSettingsPage() {
  const { currentOrg } = useOrgStore();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      if (!currentOrg) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/activity-logs/?org_id=${currentOrg.id}`);
        if (res.ok) {
          const data = await res.json();
          setLogs(data);
        }
      } catch (err) {
        console.error("Error loading activity logs:", err);
      } finally {
        setLoading(false);
      }
    }

    loadLogs();
    window.addEventListener("orgChanged", loadLogs);
    return () => window.removeEventListener("orgChanged", loadLogs);
  }, [currentOrg]);

  if (!currentOrg) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="size-12 text-muted-foreground mb-4 animate-pulse" />
        <h3 className="text-lg font-semibold">Select an organization first</h3>
        <p className="text-sm text-muted-foreground">
          Choose a tenant from the dropdown in the header to load logs.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">
          Organization Audit Trail
        </h2>
        <p className="text-sm text-muted-foreground">
          Monitor system events, updates, session changes, and access key usage
          for {currentOrg.name}.
        </p>
      </div>

      <div className="border border-border rounded-lg overflow-hidden bg-background/20">
        {loading ? (
          <div className="p-6 space-y-4">
            <div className="h-8 w-full bg-muted animate-pulse rounded" />
            <div className="h-8 w-full bg-muted animate-pulse rounded" />
            <div className="h-8 w-full bg-muted animate-pulse rounded" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="size-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No logs recorded yet for this organization.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="px-4 py-2.5">Action Event</th>
                  <th className="px-4 py-2.5">User</th>
                  <th className="px-4 py-2.5">Entity</th>
                  <th className="px-4 py-2.5">Network Context</th>
                  <th className="px-4 py-2.5">Date / Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/10">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Terminal className="size-3.5 text-blue-500 shrink-0" />
                        <span className="font-semibold text-foreground">
                          {log.action}
                        </span>
                      </div>
                      {log.metadata_json?.details && (
                        <div
                          className="text-[10px] text-muted-foreground ml-5 max-w-md truncate"
                          title={log.metadata_json.details}
                        >
                          {log.metadata_json.details}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="size-3 text-muted-foreground" />
                        <span>ID: {log.user_id || "System"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {log.entity_type ? (
                        <span className="bg-muted px-1.5 py-0.5 rounded text-[10px]">
                          {log.entity_type} #{log.entity_id}
                        </span>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Globe className="size-3 text-muted-foreground" />
                        <span>{log.ip_address}</span>
                      </div>
                      <div
                        className="text-[9px] truncate max-w-xs text-muted-foreground"
                        title={log.user_agent}
                      >
                        {log.user_agent}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

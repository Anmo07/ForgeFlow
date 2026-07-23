"use client";

import React, { useEffect, useState } from "react";
import { useOrgStore } from "@/store/organization";
import {
  Clock,
  Monitor,
  Tablet,
  Smartphone,
  LogOut,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

interface UserSession {
  id: number;
  device_name: string;
  browser: string;
  operating_system: string;
  ip_address: string;
  last_activity: string;
  expires_at: string;
  revoked: boolean;
  is_current: boolean;
}

import { useOrg } from "@/hooks/use-org";
import { isApiError } from "@/lib/errors";

export default function SessionsSettingsPage() {
  const { orgId, isOrgLoaded } = useOrg();
  const queryClient = useQueryClient();
  const activeOrgId = orgId;

  const { data: fetchedSessions, isLoading: loading } = useQuery<UserSession[]>({
    queryKey: queryKeys.orgSessions(activeOrgId),
    queryFn: async () => {
      try {
        const res = await fetch("/api/sessions/");
        if (res.ok) return await res.json();
      } catch (err) {
        console.error("Error loading sessions:", err);
      }
      return [];
    },
  });

  const sessions = fetchedSessions || [];

  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
    },
    onMutate: async (sessionId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.orgSessions(activeOrgId) });
      const previous = queryClient.getQueryData<UserSession[]>(queryKeys.orgSessions(activeOrgId));
      queryClient.setQueryData<UserSession[]>(queryKeys.orgSessions(activeOrgId), (old) =>
        old?.filter((s) => s.id !== sessionId) ?? []
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.orgSessions(activeOrgId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orgSessions(activeOrgId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardActivity(activeOrgId) });
    },
  });

  const handleRevoke = (sessionId: number) => {
    if (!confirm("Are you sure you want to terminate this session?")) return;
    revokeSessionMutation.mutate(sessionId);
  };

  const revokeAllSessionsMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/sessions/", { method: "DELETE" });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.orgSessions(activeOrgId) });
      const previous = queryClient.getQueryData<UserSession[]>(queryKeys.orgSessions(activeOrgId));
      queryClient.setQueryData<UserSession[]>(queryKeys.orgSessions(activeOrgId), (old) =>
        old?.filter((s) => s.is_current) ?? []
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.orgSessions(activeOrgId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orgSessions(activeOrgId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardActivity(activeOrgId) });
    },
  });

  const handleRevokeAll = () => {
    if (
      !confirm(
        "Are you sure you want to terminate ALL active sessions? This will log you out of other devices.",
      )
    )
      return;
    revokeAllSessionsMutation.mutate();
  };

  const getDeviceIcon = (deviceName: string) => {
    const name = deviceName.toLowerCase();
    if (
      name.includes("iphone") ||
      name.includes("phone") ||
      name.includes("android mobile")
    ) {
      return <Smartphone className="size-5 text-muted-foreground" />;
    } else if (name.includes("ipad") || name.includes("tablet")) {
      return <Tablet className="size-5 text-muted-foreground" />;
    }
    return <Monitor className="size-5 text-muted-foreground" />;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Active Login Sessions
          </h2>
          <p className="text-sm text-muted-foreground">
            Track and manage active sessions for your account across various
            devices.
          </p>
        </div>
        {sessions.length > 1 && (
          <button
            onClick={handleRevokeAll}
            className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20 px-3 py-1.5 text-xs font-semibold transition-colors"
          >
            <LogOut className="size-3.5" />
            <span>Terminate All Other Sessions</span>
          </button>
        )}
      </div>

      <div className="border border-border rounded-lg overflow-hidden bg-background/20">
        {loading ? (
          <div className="p-6 space-y-4">
            <div className="h-12 w-full bg-muted animate-pulse rounded" />
            <div className="h-12 w-full bg-muted animate-pulse rounded" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldAlert className="size-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No active sessions found.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {sessions.map((sess) => (
              <div
                key={sess.id}
                className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 bg-muted rounded-lg border border-border">
                    {getDeviceIcon(sess.device_name)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {sess.device_name}
                      </span>
                      {sess.is_current && (
                        <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-500">
                          Current Session
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground space-x-2">
                      <span>
                        {sess.browser} on {sess.operating_system}
                      </span>
                      <span>•</span>
                      <span>IP: {sess.ip_address}</span>
                      <span>•</span>
                      <span>
                        Last active:{" "}
                        {new Date(sess.last_activity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                {!sess.is_current && (
                  <button
                    onClick={() => handleRevoke(sess.id)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-destructive transition-colors px-2.5 py-1 rounded-md hover:bg-destructive/10"
                    title="Terminate session"
                  >
                    <LogOut className="size-3.5" />
                    <span className="hidden sm:inline">Log Out</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

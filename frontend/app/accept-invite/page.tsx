"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ShieldCheck, Building, Check, ArrowRight, ShieldAlert, Sparkles, Loader2 } from "lucide-react";
import { useOrgStore } from "@/store/organization";
import { useAuthStore } from "@/store/auth";

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setCurrentOrg } = useOrgStore();
  const { setAuth, user } = useAuthStore();

  const token = searchParams.get("token") || "inv_demo";
  const email = searchParams.get("email") || "invited_user@example.com";
  const roleName = searchParams.get("role") || "Admin";
  const orgName = searchParams.get("org") || "Nova";
  const orgId = searchParams.get("org_id") || "1";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  // Role Scopes mapping according to assigned role
  const getRoleScopes = (role: string) => {
    const r = role.toLowerCase();
    if (r.includes("admin") || r.includes("owner")) {
      return [
        { name: "projects.create", desc: "Create, manage, and assign team projects" },
        { name: "crm.write", desc: "Full CRM client and opportunity access" },
        { name: "invoices.create", desc: "Generate customer billing and PDF invoices" },
        { name: "billing.manage", desc: "Manage billing retainers and organization settings" },
      ];
    } else if (r.includes("member")) {
      return [
        { name: "projects.create", desc: "Create and update workspace tasks" },
        { name: "crm.read", desc: "View CRM entries and contact information" },
      ];
    }
    return [
      { name: "crm.read", desc: "View CRM entries (Read-only)" },
      { name: "projects.read", desc: "View project timelines (Read-only)" },
    ];
  };

  const scopes = getRoleScopes(roleName);

  const handleConfirmAccept = async () => {
    setIsSubmitting(true);
    try {
      await fetch("/api/memberships/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email }),
      });

      // Update active organization context
      const newOrg = {
        id: Number(orgId),
        uuid: `org-${orgId}`,
        name: orgName,
        slug: orgName.toLowerCase().replace(/\s+/g, "-"),
        role: roleName,
      };
      setCurrentOrg(newOrg);

      // If user isn't logged in, log them in as the invited user
      if (!user) {
        setAuth(
          {
            id: Date.now(),
            email: email,
            full_name: email.split("@")[0],
            role: roleName,
            is_mfa_enabled: false,
          },
          "mock-invited-jwt-token",
          "mock-refresh-token"
        );
      }

      setAccepted(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err) {
      console.error(err);
      router.push("/dashboard");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 bg-blue-600/15 blur-[120px] rounded-full pointer-events-none" />

      {/* Confirmation Popup Menu Modal */}
      <div className="relative w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200">
        
        {/* Header Icon */}
        <div className="flex items-center justify-center mb-6">
          <div className="size-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Sparkles className="size-8" />
          </div>
        </div>

        {/* Modal Title */}
        <div className="text-center space-y-2 mb-6">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Accept Organization Role
          </h1>
          <p className="text-sm text-slate-400">
            You have been invited to join <span className="text-blue-400 font-semibold">{orgName}</span>
          </p>
        </div>

        {/* Assigned Details Card */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-4 mb-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Building size={14} className="text-blue-400" />
              <span>Target Organization</span>
            </div>
            <span className="text-sm font-bold text-white">{orgName}</span>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck size={14} className="text-indigo-400" />
              <span>Assigned Role</span>
            </div>
            <span className="px-3 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-full text-xs font-bold uppercase tracking-wider">
              {roleName}
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Granted Permissions & Access Scopes ({scopes.length})
            </label>
            <div className="space-y-2">
              {scopes.map((scope, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs p-2 rounded-lg bg-slate-900 border border-slate-800/50">
                  <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-mono text-blue-300 font-semibold">{scope.name}</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">{scope.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Confirmation Actions */}
        {accepted ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center text-emerald-400 text-sm font-medium flex items-center justify-center gap-2">
            <Check className="size-5" />
            <span>Role confirmed! Redirecting to dashboard...</span>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.push("/")}
              className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-colors"
            >
              Decline
            </button>
            <button
              onClick={handleConfirmAccept}
              disabled={isSubmitting}
              className="flex-[2] py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <span>Confirm Role & Join {orgName}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-sm">
        <Loader2 className="size-6 animate-spin text-blue-500" />
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  );
}

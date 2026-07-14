"use client";

import React, { useEffect, useState } from "react";
import { useOrgStore } from "@/store/organization";
import { Fingerprint, Save, Info, Loader2, CheckCircle2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface SSOSettings {
  sso_enabled: boolean;
  sso_provider: string;
  sso_client_id: string;
  sso_client_secret_configured: boolean;
  sso_issuer_url: string;
}

export default function SsoSettingsPage() {
  const { currentOrg } = useOrgStore();
  
  const [ssoEnabled, setSsoEnabled] = useState(false);
  const [ssoProvider, setSsoProvider] = useState("google");
  const [ssoClientId, setSsoClientId] = useState("");
  const [ssoClientSecret, setSsoClientSecret] = useState("");
  const [ssoIssuerUrl, setSsoIssuerUrl] = useState("https://accounts.google.com");
  const [secretConfigured, setSecretConfigured] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    async function loadSSOSettings() {
      if (!currentOrg) return;
      setLoading(true);
      setMessage(null);
      try {
        const res = await fetch(`/api/organizations/${currentOrg.id}/sso`, {
          headers: {
            "X-Organization-ID": String(currentOrg.id),
          },
        });
        if (res.ok) {
          const data: SSOSettings = await res.json();
          setSsoEnabled(data.sso_enabled);
          setSsoProvider(data.sso_provider || "google");
          setSsoClientId(data.sso_client_id || "");
          setSsoIssuerUrl(data.sso_issuer_url || "https://accounts.google.com");
          setSecretConfigured(data.sso_client_secret_configured);
          if (data.sso_client_secret_configured) {
            setSsoClientSecret("********");
          } else {
            setSsoClientSecret("");
          }
        } else {
          // If unauthorized or forbidden (only Owner can view)
          const errData = await res.json().catch(() => ({}));
          setMessage({
            type: "error",
            text: errData.detail || "Only the Organization Owner can configure SSO settings.",
          });
        }
      } catch (err) {
        console.error("Error loading SSO settings:", err);
        setMessage({
          type: "error",
          text: "Failed to load SSO settings from backend.",
        });
      } finally {
        setLoading(false);
      }
    }

    loadSSOSettings();
    window.addEventListener("orgChanged", loadSSOSettings);
    return () => window.removeEventListener("orgChanged", loadSSOSettings);
  }, [currentOrg]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg) return;
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/organizations/${currentOrg.id}/sso`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Organization-ID": String(currentOrg.id),
        },
        body: JSON.stringify({
          sso_enabled: ssoEnabled,
          sso_provider: ssoProvider,
          sso_client_id: ssoClientId,
          sso_client_secret: ssoClientSecret,
          sso_issuer_url: ssoIssuerUrl,
        }),
      });

      if (res.ok) {
        const data: SSOSettings = await res.json();
        setSecretConfigured(data.sso_client_secret_configured);
        if (data.sso_client_secret_configured) {
          setSsoClientSecret("********");
        }
        setMessage({
          type: "success",
          text: "SSO settings updated successfully.",
        });
      } else {
        const errData = await res.json().catch(() => ({}));
        setMessage({
          type: "error",
          text: errData.detail || "Failed to save SSO settings.",
        });
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: "A network error occurred while saving.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!currentOrg) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Fingerprint className="size-12 text-muted-foreground mb-4 animate-pulse" />
        <h3 className="text-lg font-semibold">Select an organization first</h3>
        <p className="text-sm text-muted-foreground">
          Choose a tenant from the header dropdown to view SSO configurations.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Fingerprint className="size-5 text-primary" />
          <span>Single Sign-On (SSO) Configuration</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Enforce authentication policies via external OIDC / Identity Providers.
        </p>
      </div>

      {message && (
        <div
          className={cn(
            "p-4 rounded-xl border flex gap-3 text-sm",
            message.type === "success"
              ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          )}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="size-5 shrink-0" />
          ) : (
            <ShieldAlert className="size-5 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Toggle Switch */}
        <div className="bg-background/40 border border-border p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="font-semibold text-sm">Enable SSO Integration</div>
            <div className="text-xs text-muted-foreground">
              Redirect members to authenticate through OIDC before accessing the dashboard.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSsoEnabled(!ssoEnabled)}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              ssoEnabled ? "bg-primary" : "bg-muted"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out",
                ssoEnabled ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>

        {ssoEnabled && (
          <div className="space-y-4 bg-background/20 border border-border/60 p-5 rounded-xl">
            {/* SSO Provider selection */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Identity Provider Type
              </label>
              <select
                value={ssoProvider}
                onChange={(e) => setSsoProvider(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="google">Google Workspace</option>
              </select>
            </div>

            {/* Client ID */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                OIDC Client ID
              </label>
              <input
                type="text"
                value={ssoClientId}
                onChange={(e) => setSsoClientId(e.target.value)}
                placeholder="e.g. 1234567890-abcdef.apps.googleusercontent.com"
                required
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Client Secret */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                OIDC Client Secret
              </label>
              <input
                type="password"
                value={ssoClientSecret}
                onChange={(e) => setSsoClientSecret(e.target.value)}
                placeholder="Paste client secret key here"
                required
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
              {secretConfigured && (
                <div className="text-[10px] text-green-500 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="size-3" />
                  <span>Secret key is configured and encrypted.</span>
                </div>
              )}
            </div>

            {/* Issuer URL */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                OIDC Issuer URL
              </label>
              <input
                type="url"
                value={ssoIssuerUrl}
                onChange={(e) => setSsoIssuerUrl(e.target.value)}
                placeholder="https://accounts.google.com"
                required
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="flex gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-600 dark:text-blue-400">
              <Info className="size-4 shrink-0 mt-0.5" />
              <div>
                Ensure your Identity Provider allows the callback URL:{" "}
                <code className="bg-background px-1 py-0.5 rounded font-mono break-all text-[11px] block mt-1 select-all border border-border/40">
                  http://localhost:8000/api/auth/sso/google/callback
                </code>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground text-background hover:bg-foreground/90 px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          <span>{saving ? "Saving settings..." : "Save Settings"}</span>
        </button>
      </form>
    </div>
  );
}

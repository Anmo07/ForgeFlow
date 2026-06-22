"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { apiFetch } from "@/lib/api";

declare global {
  interface Window {
    turnstile: {
      render: (
        container: string | HTMLElement,
        options: Record<string, unknown>,
      ) => string;
      reset: (widgetId: string) => void;
    };
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string>("");

  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad";
    script.async = true;

    (window as unknown as Record<string, unknown>).onTurnstileLoad = () => {
      if (turnstileRef.current && window.turnstile) {
        widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
          sitekey: "1x00000000000000000000AA",
          theme: "dark",
          callback: (token: string) => setTurnstileToken(token),
        });
      }
    };

    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!turnstileToken) {
      setError("Please complete the security challenge.");
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<{
        access_token: string;
        refresh_token: string;
        user: {
          id: number;
          email: string;
          full_name: string | null;
          is_active: boolean;
        };
      }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          turnstile_token: turnstileToken,
        }),
      });

      setAuth(data.user, data.access_token, data.refresh_token);
      router.push("/");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);

      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
        setTurnstileToken("");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="rounded-2xl p-8 glass-strong">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10">
              <LogIn className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Welcome back
              </h1>
              <p className="text-sm text-muted-foreground">
                Log in to your ForgeFlow account
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-medium mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-medium mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <div ref={turnstileRef} className="flex justify-center" />

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold shadow hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LogIn className="size-4" />
              )}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-primary font-semibold hover:underline"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

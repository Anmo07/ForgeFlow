"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string>("");
  const turnstileKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";

  useEffect(() => {
    const lastEmail = localStorage.getItem("forgeflow_last_email");
    const lastPassword = localStorage.getItem("forgeflow_last_password");
    if (lastEmail) setEmail(lastEmail);
    if (lastPassword) setPassword(lastPassword);
  }, []);

  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad";
    script.async = true;

    (window as unknown as Record<string, unknown>).onTurnstileLoad = () => {
      if (turnstileRef.current && window.turnstile) {
        widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
          sitekey: turnstileKey,
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

        // Remember credentials upon successful backend login
        localStorage.setItem("forgeflow_last_email", email);
        localStorage.setItem("forgeflow_last_password", password);
        setAuth(data.user, data.access_token, data.refresh_token);
      } catch (backendErr) {
        console.warn("Backend login failed, attempting local credentials matching:", backendErr);
        
        const localUsers = JSON.parse(localStorage.getItem("forgeflow_users") || "[]");
        const match = localUsers.find((u: any) => u.email === email && u.password === password);
        
        if (match) {
          const userObj = {
            id: match.id,
            email: match.email,
            full_name: match.full_name,
            is_active: match.is_active
          };
          // Remember credentials upon successful local login
          localStorage.setItem("forgeflow_last_email", email);
          localStorage.setItem("forgeflow_last_password", password);
          setAuth(userObj, "mock-access-token", "mock-refresh-token");
        } else {
          throw new Error("Invalid email or password.");
        }
      }
      
      window.location.href = "/dashboard";
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
    <div className="relative flex flex-1 items-center justify-center p-6 overflow-hidden min-h-screen">
      {/* Background mesh */}
      <div className="absolute inset-0 z-[-1] pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] rounded-full bg-primary/10 blur-[80px] animate-float" />
        <div className="absolute bottom-0 left-1/4 w-[350px] h-[350px] rounded-full bg-[#a855f7]/10 blur-[70px] animate-float-delayed" />
      </div>

      <div className="w-full max-w-md z-10">
        <div className="rounded-2xl p-8 card-glow border border-border/40 bg-white/40 dark:bg-white/[0.02] backdrop-blur-sm shadow-xl">
          {/* Logo Branding */}
          <div className="flex flex-col items-center mb-8">
            <Link href="/" className="mb-4 inline-block">
              <span className="text-3xl font-extrabold tracking-tight">
                <span className="gradient-text">Forge</span>
                <span className="text-foreground">Flow</span>
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10">
                <LogIn className="size-5 text-primary" />
              </div>
              <div className="text-left">
                <h1 className="text-xl font-bold tracking-tight">
                  Welcome back
                </h1>
                <p className="text-xs text-muted-foreground">
                  Log in to your ForgeFlow account
                </p>
              </div>
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
                  className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-sm font-medium"
                >
                  Password
                </label>
                <Link href="#" className="text-sm font-medium text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-background border border-border rounded-lg pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
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

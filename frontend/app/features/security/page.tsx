"use client";

import Link from "next/link";
import { Shield, Key, Lock, Globe, Server, Eye, ArrowLeft } from "lucide-react";

const capabilities = [
  { title: "MFA / TOTP Authentication", description: "Time-based one-time passwords with QR code setup, plus 8 single-use backup codes. MFA verification on every login with temp token flow.", icon: Key },
  { title: "Cloudflare Tunnel Ingress", description: "Zero-trust network access via cloudflared. No exposed ports, no public IP required. Secure your entire stack behind Cloudflare's edge network.", icon: Globe },
  { title: "Cloudflare Turnstile", description: "Bot protection on every auth endpoint — login, registration, password reset. Smart challenge that stops automated attacks without annoying CAPTCHAs.", icon: Shield },
  { title: "Field-Level Encryption", description: "Fernet encryption for sensitive fields like MFA secrets and API keys. Key versioning support for rotation without downtime.", icon: Lock },
  { title: "Tenant Data Isolation", description: "SQLAlchemy event listeners automatically inject tenant constraints at the ORM level. Cross-tenant data leakage is structurally impossible.", icon: Server },
  { title: "Session Management", description: "Device tracking, IP logging, session revocation, and refresh token rotation. Full audit trail of every authentication event.", icon: Eye },
];

export default function SecurityFeaturePage() {
  return (
    <div className="dark:bg-gray-dark bg-white">
      <section className="relative overflow-hidden pt-[120px] pb-16 md:pt-[150px] md:pb-[80px]">
        <div className="container">
          <Link href="/features" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-body-color hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Features
          </Link>
          <div className="max-w-[700px]">
            <span className="mb-4 inline-block rounded-full border border-rose-500/20 bg-rose-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-rose-500">
              Enterprise Security
            </span>
            <h1 className="mb-5 text-3xl font-bold leading-tight text-black dark:text-white sm:text-4xl md:text-5xl">
              Security-First Architecture
            </h1>
            <p className="text-base text-body-color dark:text-body-color-dark sm:text-lg">
              Every layer of ForgeFlow is hardened — from Cloudflare edge protection and CSRF tokens to field-level Fernet encryption and automatic tenant isolation.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-16 md:pb-20 lg:pb-28">
        <div className="container">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((cap, index) => {
              const Icon = cap.icon;
              return (
                <div key={index} className="rounded-xl border border-body-color/10 bg-white p-7 shadow-one dark:border-white/10 dark:bg-gray-dark dark:shadow-gray-dark">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 text-lg font-bold text-black dark:text-white">{cap.title}</h3>
                  <p className="text-sm leading-relaxed text-body-color dark:text-body-color-dark">{cap.description}</p>
                </div>
              );
            })}
          </div>

          {/* Additional security details */}
          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20 p-8">
              <h3 className="mb-4 text-xl font-bold text-black dark:text-white">Authentication Flow</h3>
              <ul className="space-y-3 text-sm text-body-color dark:text-body-color-dark">
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Argon2id password hashing with auto-rehash</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> JWT access tokens (30 min) + refresh tokens (30 days)</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> HttpOnly, SameSite=Strict cookie transport</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> CSRF token validation on state-changing requests</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Account lockout after repeated failed attempts</li>
              </ul>
            </div>
            <div className="rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20 p-8">
              <h3 className="mb-4 text-xl font-bold text-black dark:text-white">Rate Limiting</h3>
              <ul className="space-y-3 text-sm text-body-color dark:text-body-color-dark">
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Per-IP rate limiting: 10 login attempts / 60 seconds</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Per-email rate limiting: 5 login attempts / 300 seconds</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Password reset: 3 requests / 300 seconds per IP</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> MFA verification: 10 attempts / 60 seconds per IP</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Redis-backed sliding window counters</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link href="/register" className="rounded-sm bg-primary px-8 py-4 text-base font-semibold text-white duration-300 ease-in-out hover:bg-primary/80">Get Started Free</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldAlert, ArrowLeft, ShieldCheck } from "lucide-react";

const MotionDiv = motion.div as any;

export default function PrivacyPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-6 overflow-hidden">
      {/* Background mesh */}
      <div className="absolute inset-0 z-[-1] pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[100px] animate-float" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-[#a855f7]/10 blur-[80px] animate-float-delayed" />
      </div>

      <div className="w-full max-w-2xl z-10 my-8">
        <MotionDiv
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl p-8 sm:p-12 card-glow border border-border/40 bg-white/40 dark:bg-white/[0.02] backdrop-blur-sm shadow-xl"
        >
          {/* Back button */}
          <Link
            href="/register"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline mb-8"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Registration
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center size-12 rounded-xl bg-primary/10 text-primary">
              <ShieldAlert className="size-6" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                Privacy Policy
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Last updated: July 2026
              </p>
            </div>
          </div>

          <div className="space-y-6 text-base leading-relaxed text-muted-foreground border-t border-border/30 pt-6">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex gap-3 text-sm text-primary">
              <ShieldCheck className="h-5 w-5 shrink-0" />
              <div>
                <strong className="font-semibold block mb-0.5">Data Usage Notice</strong>
                We process minimal telemetry, CRM metrics, and metadata to provide tenant isolation and improve AI invoice matching logic.
              </div>
            </div>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">1. Information We Collect</h2>
              <p>
                To utilize the AI features of the platform, we collect operational data including CRM metrics, user metadata, project card descriptions, and transaction values.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">2. How We Use Information</h2>
              <p>
                The primary purpose of collecting data is to operate and customize the multi-tenant isolation engine. Additionally, we use aggregated, de-identified operational patterns and data metrics to train and improve the AI models of the platform.
              </p>
              <p className="mt-2 text-foreground font-medium">
                🔒 Note: Personal identifiers are redacted or hashed at rest, and all client files are subject to field-level database encryption.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">3. Liability Disclaimer</h2>
              <p>
                Because ForgeFlow is an AI-powered SaaS assistant, results are predictive. The creators are in no way liable or responsible for any financial loss, billing discrepancies, or unexpected business deficits arising from system recommendations.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">4. Security Safeguards</h2>
              <p>
                Data is protected by Cloudflare Edge systems, Fernet DB encryption, Argon2id hashing, and ORM-level tenant isolation. Secure sessions are tracked on your local browser.
              </p>
            </section>
          </div>
        </MotionDiv>
      </div>
    </div>
  );
}

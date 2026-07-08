"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FileText, ArrowLeft, Shield } from "lucide-react";

const MotionDiv = motion.div as any;

export default function TermsPage() {
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
              <FileText className="size-6" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                Terms of Service
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Last updated: July 2026
              </p>
            </div>
          </div>

          <div className="space-y-6 text-base leading-relaxed text-muted-foreground border-t border-border/30 pt-6">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex gap-3 text-sm text-primary">
              <Shield className="h-5 w-5 shrink-0" />
              <div>
                <strong className="font-semibold block mb-0.5">AI-Powered Platform Notice</strong>
                ForgeFlow leverages advanced machine learning models and artificial intelligence to process operations, project prioritization, CRM analytics, and automated invoicing.
              </div>
            </div>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">1. Acceptance of Terms</h2>
              <p>
                By creating an account or using the ForgeFlow platform, you agree to comply with and be bound by these Terms of Service. If you do not agree, please do not access or use the platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">2. AI Features & No Liability</h2>
              <p>
                ForgeFlow is an AI-powered operations engine. While we strive to provide highly accurate suggestions and automations, AI predictions, project boards, CRM analytics, and invoice drafts can contain anomalies.
              </p>
              <p className="mt-2 text-foreground font-medium">
                ⚠️ IMPORTANT LIMITATION: The creators and operators of ForgeFlow are in no way responsible or liable for any unpredicted losses, financial deficits, missed leads, invoice discrepancies, or operational business damages resulting from the use or dependency on the platform's AI predictions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">3. Data & Platform Improvement</h2>
              <p>
                To provide and continually optimize the platform, ForgeFlow processes organization-level usage analytics and metrics. You agree that metadata and patterns collected during your interactions may be analyzed to improve system accuracy, security measures, and AI models.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">4. Security & Account Protection</h2>
              <p>
                Users must enable MFA/TOTP security features and enforce tenant isolation protocols on their account. You are responsible for safeguarding your master access credentials.
              </p>
            </section>
          </div>
        </MotionDiv>
      </div>
    </div>
  );
}

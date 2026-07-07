"use client";

import Link from "next/link";
import { Users, TrendingUp, Mail, Phone, Building, ArrowLeft } from "lucide-react";

const capabilities = [
  {
    title: "Client Management",
    description: "Maintain a comprehensive database of all your MSP clients with contact details, company info, and complete engagement history.",
    icon: Users,
  },
  {
    title: "Lead Pipeline",
    description: "Track leads from initial contact through qualification to conversion. Visual pipeline stages: New → Contacted → Qualified → Proposal → Won/Lost.",
    icon: TrendingUp,
  },
  {
    title: "Deal Tracking",
    description: "Convert qualified leads into deals with value estimates, assigned team members, and stage progression from Discovery through Negotiation to Close.",
    icon: Building,
  },
  {
    title: "Contact Integration",
    description: "One-click email and phone actions directly from the CRM. Every client record links to associated leads, deals, and billing contracts.",
    icon: Mail,
  },
  {
    title: "Conversion Analytics",
    description: "Real-time metrics for pipeline value, deals won, conversion rates, and active lead counts. Make data-driven decisions about your sales process.",
    icon: Phone,
  },
  {
    title: "Team Assignment",
    description: "Assign leads and deals to specific team members. Track performance per representative and balance workloads across your organization.",
    icon: Users,
  },
];

export default function CRMFeaturePage() {
  return (
    <div className="dark:bg-gray-dark bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden pt-[120px] pb-16 md:pt-[150px] md:pb-[80px]">
        <div className="container">
          <Link
            href="/features"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-body-color hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Features
          </Link>
          <div className="max-w-[700px]">
            <span className="mb-4 inline-block rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-500">
              CRM Module
            </span>
            <h1 className="mb-5 text-3xl font-bold leading-tight text-black dark:text-white sm:text-4xl md:text-5xl">
              Multi-Tenant CRM Built for MSPs
            </h1>
            <p className="text-base text-body-color dark:text-body-color-dark sm:text-lg">
              Track clients, qualify leads, close deals, and analyze your sales
              pipeline — all within tenant-isolated workspaces that keep every
              organization&apos;s data completely separate and secure.
            </p>
          </div>
        </div>
      </section>

      {/* Capabilities Grid */}
      <section className="pb-16 md:pb-20 lg:pb-28">
        <div className="container">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((cap, index) => {
              const Icon = cap.icon;
              return (
                <div
                  key={index}
                  className="rounded-xl border border-body-color/10 bg-white p-7 shadow-one dark:border-white/10 dark:bg-gray-dark dark:shadow-gray-dark"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 text-lg font-bold text-black dark:text-white">
                    {cap.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-body-color dark:text-body-color-dark">
                    {cap.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <div className="mt-16 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20 p-10 text-center">
            <h2 className="mb-3 text-2xl font-bold text-black dark:text-white">
              Start managing your client relationships today
            </h2>
            <p className="mx-auto mb-6 max-w-md text-body-color dark:text-body-color-dark">
              Create your free account and set up your CRM pipeline in minutes.
            </p>
            <Link
              href="/register"
              className="rounded-sm bg-primary px-8 py-4 text-base font-semibold text-white duration-300 ease-in-out hover:bg-primary/80"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

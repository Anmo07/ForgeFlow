"use client";

import Link from "next/link";
import {
  Users,
  DollarSign,
  BarChart3,
  FileText,
  Shield,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    title: "CRM & Sales Pipeline",
    description:
      "Track clients, qualify leads, manage deals, and analyze conversion rates — all within isolated tenant workspaces.",
    href: "/features/crm",
    icon: Users,
    color: "emerald",
  },
  {
    title: "Automated Billing Engine",
    description:
      "Dynamic retainers, per-seat subscriptions, and time & materials billing with fully automated invoice generation.",
    href: "/features/billing",
    icon: DollarSign,
    color: "blue",
  },
  {
    title: "Project Management",
    description:
      "Kanban boards with drag-and-drop tasks, priority levels, sprint planning, and billable hour tracking.",
    href: "/features/projects",
    icon: BarChart3,
    color: "purple",
  },
  {
    title: "Enterprise Security",
    description:
      "MFA/TOTP, Cloudflare Tunnel, field-level encryption, tenant isolation, CSRF protection, and rate limiting.",
    href: "/features/security",
    icon: Shield,
    color: "rose",
  },
];

export default function FeaturesPage() {
  return (
    <div className="dark:bg-gray-dark bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden pt-[120px] pb-16 md:pt-[150px] md:pb-[80px]">
        <div className="container text-center">
          <span className="mb-4 inline-block rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            Platform Features
          </span>
          <h1 className="mb-5 text-3xl font-bold leading-tight text-black dark:text-white sm:text-4xl md:text-5xl">
            Everything You Need to Run Your MSP
          </h1>
          <p className="mx-auto max-w-[620px] text-base text-body-color dark:text-body-color-dark sm:text-lg">
            ForgeFlow consolidates CRM, project management, automated billing,
            and enterprise security into a single, high-performance platform
            purpose-built for IT service providers.
          </p>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="pb-16 md:pb-20 lg:pb-28">
        <div className="container">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Link
                  key={feature.title}
                  href={feature.href}
                  className="group relative overflow-hidden rounded-xl border border-body-color/10 bg-white p-8 shadow-one transition-all duration-300 hover:shadow-two hover:border-primary/30 dark:border-white/10 dark:bg-gray-dark dark:shadow-gray-dark dark:hover:border-primary/30"
                >
                  <div className="mb-5 flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-7 w-7" />
                    </div>
                    <h3 className="text-xl font-bold text-black dark:text-white">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="mb-6 text-base leading-relaxed text-body-color dark:text-body-color-dark">
                    {feature.description}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:gap-2.5 transition-all">
                    Learn more <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              );
            })}
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <h2 className="mb-4 text-2xl font-bold text-black dark:text-white">
              Ready to streamline your MSP operations?
            </h2>
            <p className="mx-auto mb-8 max-w-md text-body-color dark:text-body-color-dark">
              Get started with ForgeFlow today — no credit card required.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="rounded-sm bg-primary px-8 py-4 text-base font-semibold text-white duration-300 ease-in-out hover:bg-primary/80"
              >
                🚀 Get Started Free
              </Link>
              <Link
                href="/#pricing"
                className="rounded-sm border border-body-color/20 bg-transparent px-8 py-4 text-base font-semibold text-dark duration-300 ease-in-out hover:border-primary hover:text-primary dark:border-white/20 dark:text-white dark:hover:border-primary dark:hover:text-primary"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

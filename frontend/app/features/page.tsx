"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  DollarSign,
  BarChart3,
  Shield,
  ArrowRight,
} from "lucide-react";

// Safe casting to bypass TS/React 19 types conflicts on Framer Motion elements
const MotionDiv = motion.div as any;

const features = [
  {
    title: "CRM & Sales Pipeline",
    description:
      "Track clients, qualify leads, manage deals, and analyze conversion rates — all within isolated tenant workspaces.",
    href: "/features/crm",
    icon: Users,
    gradient: "from-emerald-500/10 to-teal-500/10",
    iconColor: "text-emerald-500",
  },
  {
    title: "Automated Billing Engine",
    description:
      "Dynamic retainers, per-seat subscriptions, and time & materials billing with fully automated invoice generation.",
    href: "/features/billing",
    icon: DollarSign,
    gradient: "from-blue-500/10 to-primary/10",
    iconColor: "text-blue-500",
  },
  {
    title: "Project Management",
    description:
      "Kanban boards with drag-and-drop tasks, priority levels, sprint planning, and billable hour tracking.",
    href: "/features/projects",
    icon: BarChart3,
    gradient: "from-[#a855f7]/10 to-primary/10",
    iconColor: "text-[#a855f7]",
  },
  {
    title: "Enterprise Security",
    description:
      "MFA/TOTP, Cloudflare Tunnel, field-level encryption, tenant isolation, CSRF protection, and rate limiting.",
    href: "/features/security",
    icon: Shield,
    gradient: "from-rose-500/10 to-orange-500/10",
    iconColor: "text-rose-500",
  },
];

export default function FeaturesPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden pt-[140px] pb-16 md:pt-[170px] md:pb-[80px]">
        {/* Background mesh */}
        <div className="absolute inset-0 z-[-1]">
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-primary/15 blur-[100px] animate-float" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-[#a855f7]/10 blur-[80px] animate-float-delayed" />
        </div>

        <div className="container text-center">
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 dark:bg-primary/10 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-primary backdrop-blur-sm"
          >
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Platform Features
          </MotionDiv>
          <MotionDiv
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-5 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl md:text-5xl"
          >
            Everything You Need to{" "}
            <span className="gradient-text">Run Your MSP</span>
          </MotionDiv>
          <MotionDiv
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto max-w-[620px] text-base text-muted-foreground sm:text-lg"
          >
            ForgeFlow consolidates CRM, project management, automated billing,
            and enterprise security into a single, high-performance platform
            purpose-built for IT service providers.
          </MotionDiv>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="pb-16 md:pb-20 lg:pb-28">
        <div className="container">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <MotionDiv
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Link
                    href={feature.href}
                    className="card-glow group relative block h-full overflow-hidden rounded-2xl border border-border/40 bg-white/40 dark:bg-white/[0.02] backdrop-blur-sm p-8 transition-all duration-300 hover:border-primary/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/[0.04]"
                  >
                    {/* Gradient accent line at top */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="mb-5 flex items-center gap-4">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} ${feature.iconColor} ring-1 ring-border/20 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg`}>
                        <Icon className="h-7 w-7" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground">
                        {feature.title}
                      </h3>
                    </div>
                    <p className="mb-6 text-base leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-all group-hover:gap-2.5">
                      Learn more <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                </MotionDiv>
              );
            })}
          </div>

          {/* CTA */}
          <MotionDiv
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-16 text-center"
          >
            <h2 className="mb-4 text-2xl font-bold text-foreground">
              Ready to streamline your MSP operations?
            </h2>
            <p className="mx-auto mb-8 max-w-md text-muted-foreground">
              Get started with ForgeFlow today — no credit card required.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-semibold text-white shadow-xl shadow-primary/25 transition-all duration-300 hover:bg-primary/90 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/#pricing"
                className="inline-flex items-center rounded-xl border border-border/60 bg-white/50 dark:bg-white/5 backdrop-blur-sm px-8 py-4 text-base font-semibold text-foreground transition-all duration-300 hover:border-primary/40 hover:bg-primary/5 hover:-translate-y-0.5"
              >
                View Pricing
              </Link>
            </div>
          </MotionDiv>
        </div>
      </section>
    </div>
  );
}

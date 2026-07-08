"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Shield, BarChart3 } from "lucide-react";

const Hero = () => {
  return (
    <>
      <section
        id="home"
        className="relative z-10 overflow-hidden pb-16 pt-[140px] md:pb-[120px] md:pt-[170px] xl:pb-[160px] xl:pt-[200px] 2xl:pb-[200px] 2xl:pt-[220px]"
      >
        {/* Animated mesh background */}
        <div className="absolute inset-0 z-[-2]">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px] animate-float" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-[#0ea5e9]/15 blur-[100px] animate-float-delayed" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[#a855f7]/10 blur-[80px]" />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 z-[-1] opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: `linear-gradient(rgba(74, 108, 247, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(74, 108, 247, 0.5) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        <div className="container">
          <div className="mx-auto max-w-[900px] text-center">
            {/* Animated badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 dark:bg-primary/10 px-5 py-2 text-sm font-semibold text-primary backdrop-blur-sm"
            >
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              Now with AI-powered billing automation
              <ArrowRight className="h-3.5 w-3.5" />
            </motion.div>

            {/* Hero heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-6 text-4xl font-extrabold leading-[1.15] tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-[68px]"
            >
              The Command Center for{" "}
              <span className="gradient-text">
                Modern MSPs
              </span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mx-auto mb-10 max-w-[680px] text-lg !leading-relaxed text-muted-foreground md:text-xl"
            >
              ForgeFlow consolidates CRM, project management, automated
              billing, and client portals into a single high-performance
              platform — purpose-built for IT service providers.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-semibold text-white shadow-xl shadow-primary/25 transition-all duration-300 hover:bg-primary/90 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-white/50 dark:bg-white/5 backdrop-blur-sm px-8 py-4 text-base font-semibold text-foreground transition-all duration-300 hover:border-primary/40 hover:bg-primary/5 hover:-translate-y-0.5"
              >
                View Dashboard Demo
              </Link>
            </motion.div>

            {/* Floating stats */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6 max-w-[700px] mx-auto"
            >
              {[
                { icon: Zap, label: "Automated Billing", value: "100%", color: "text-amber-500" },
                { icon: Shield, label: "Uptime SLA", value: "99.9%", color: "text-emerald-500" },
                { icon: BarChart3, label: "Faster Invoicing", value: "10x", color: "text-blue-500" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className={`group flex items-center gap-3 rounded-xl border border-border/40 bg-white/50 dark:bg-white/[0.03] backdrop-blur-md p-4 shadow-lg shadow-black/[0.03] transition-all duration-300 hover:border-primary/30 hover:-translate-y-1 ${
                    i === 1 ? "animate-float-delayed" : i === 2 ? "animate-float" : ""
                  }`}
                  style={{ animationDelay: `${i * 0.5}s` }}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 dark:bg-primary/10 ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-xl font-extrabold text-foreground">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;

"use client";

import { motion } from "framer-motion";
import SectionTitle from "../Common/SectionTitle";
import { CheckCircle2 } from "lucide-react";

const checkVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.1 * i, duration: 0.4 },
  }),
};

const AboutSectionOne = () => {
  const features = [
    "Multi-Tenant Isolation",
    "Automated Billing",
    "CRM Pipeline",
    "Kanban Projects",
    "PDF Invoicing",
    "MFA / TOTP Security",
  ];

  return (
    <section id="about" className="landing-section pt-16 md:pt-20 lg:pt-28">
      <div className="container">
        <div className="border-b border-border/30 pb-16 md:pb-20 lg:pb-28">
          <div className="flex flex-wrap items-center -mx-4">
            <div className="w-full px-4 lg:w-1/2">
              <SectionTitle
                title="Why IT Service Providers Choose ForgeFlow"
                paragraph="Stop switching between disconnected CRM spreadsheets, bloated PSA tools, and manual time trackers. ForgeFlow consolidates your entire MSP operation into one high-performance portal."
                mb="44px"
              />

              <div className="mb-12 max-w-[570px] lg:mb-0">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {features.map((text, i) => (
                    <motion.div
                      key={text}
                      custom={i}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                      variants={checkVariants}
                      className="flex items-center gap-3 rounded-lg border border-border/30 bg-white/30 dark:bg-white/[0.02] backdrop-blur-sm px-4 py-3 transition-colors hover:border-primary/30"
                    >
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                      <span className="text-base font-medium text-foreground/80">{text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            <div className="w-full px-4 lg:w-1/2">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative mx-auto aspect-[25/24] max-w-[500px] lg:mr-0"
              >
                <div className="card-glow flex items-center justify-center h-full rounded-2xl bg-gradient-to-br from-primary/5 via-[#0ea5e9]/5 to-[#a855f7]/5 dark:from-primary/10 dark:via-[#0ea5e9]/8 dark:to-[#a855f7]/8 border border-border/40 backdrop-blur-sm overflow-hidden">
                  {/* Background mesh */}
                  <div
                    className="absolute inset-0 opacity-[0.04] dark:opacity-[0.08]"
                    style={{
                      backgroundImage: `linear-gradient(rgba(74, 108, 247, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(74, 108, 247, 0.5) 1px, transparent 1px)`,
                      backgroundSize: "40px 40px",
                    }}
                  />
                  <div className="relative text-center p-8">
                    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-[#0ea5e9]/20 shadow-lg shadow-primary/10">
                      <svg className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Unified Dashboard</h3>
                    <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
                      Projects, CRM, Invoices, and Settings — all accessible from a single command center with real-time metrics.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSectionOne;

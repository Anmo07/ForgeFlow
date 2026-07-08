"use client";

import { motion } from "framer-motion";

const AboutSectionTwo = () => {
  const sections = [
    {
      number: "01",
      title: "Zero-Trust Architecture",
      description:
        "Every API request is authenticated via JWT cookies with CSRF protection, rate limiting, and automatic session revocation. Cloudflare Tunnel eliminates exposed ingress ports entirely.",
    },
    {
      number: "02",
      title: "Tenant Data Isolation",
      description:
        "SQLAlchemy event listeners automatically inject tenant constraints at the ORM level — making cross-tenant data leakage structurally impossible.",
    },
    {
      number: "03",
      title: "Production-Ready Stack",
      description:
        "Built on Next.js 15, FastAPI, PostgreSQL with PgBouncer, Redis, and Celery — containerized with Docker Compose for one-command deployment.",
    },
  ];

  return (
    <section className="landing-section py-16 md:py-20 lg:py-28">
      <div className="container">
        <div className="flex flex-wrap items-center -mx-4">
          <div className="w-full px-4 lg:w-1/2">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative mx-auto mb-12 aspect-[25/24] max-w-[500px] text-center lg:m-0"
            >
              <div className="card-glow flex items-center justify-center h-full rounded-2xl bg-gradient-to-br from-[#a855f7]/5 via-primary/5 to-[#0ea5e9]/5 dark:from-[#a855f7]/10 dark:via-primary/8 dark:to-[#0ea5e9]/8 border border-border/40 backdrop-blur-sm overflow-hidden">
                {/* Background mesh */}
                <div
                  className="absolute inset-0 opacity-[0.04] dark:opacity-[0.08]"
                  style={{
                    backgroundImage: `radial-gradient(circle, rgba(168, 85, 247, 0.4) 1px, transparent 1px)`,
                    backgroundSize: "20px 20px",
                  }}
                />
                <div className="relative text-center p-8">
                  <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#a855f7]/20 to-primary/20 shadow-lg shadow-[#a855f7]/10">
                    <svg className="h-10 w-10 text-[#a855f7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Enterprise-Grade Security</h3>
                  <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
                    Every layer of ForgeFlow is hardened — from Cloudflare edge protection to field-level encryption at rest.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="w-full px-4 lg:w-1/2">
            <div className="max-w-[470px]">
              {sections.map((section, index) => (
                <motion.div
                  key={section.number}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  className={index < sections.length - 1 ? "mb-9" : "mb-1"}
                >
                  <div className="flex items-start gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-[#a855f7]/10 text-xs font-bold text-primary ring-1 ring-primary/10">
                      {section.number}
                    </span>
                    <div>
                      <h3 className="mb-3 text-xl font-bold text-foreground sm:text-2xl lg:text-xl xl:text-2xl">
                        {section.title}
                      </h3>
                      <p className="text-base leading-relaxed text-muted-foreground sm:text-lg sm:leading-relaxed">
                        {section.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSectionTwo;

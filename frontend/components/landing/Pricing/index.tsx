"use client";
import { useState } from "react";
import SectionTitle from "../Common/SectionTitle";
import OfferList from "./OfferList";
import PricingBox from "./PricingBox";

const Pricing = () => {
  const [isMonthly, setIsMonthly] = useState(true);

  return (
    <section id="pricing" className="landing-section relative z-10 py-16 md:py-20 lg:py-28">
      <div className="container">
        <SectionTitle
          title="Simple and Transparent Pricing"
          paragraph="Choose the plan that fits your MSP. All plans include multi-tenant isolation, Cloudflare security, and unlimited team members."
          center
          width="665px"
        />

        <div className="w-full">
          <div className="mb-10 flex justify-center md:mb-14 lg:mb-16">
            {/* Modern toggle */}
            <div className="inline-flex items-center gap-3 rounded-full border border-border/40 bg-white/40 dark:bg-white/[0.03] backdrop-blur-sm p-1.5">
              <button
                onClick={() => setIsMonthly(true)}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300 ${
                  isMonthly
                    ? "bg-primary text-white shadow-lg shadow-primary/25"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsMonthly(false)}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300 ${
                  !isMonthly
                    ? "bg-primary text-white shadow-lg shadow-primary/25"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Yearly
                <span className="ml-1.5 text-xs opacity-80">-20%</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
          <PricingBox
            packageName="Starter"
            price={isMonthly ? "49" : "470"}
            duration={isMonthly ? "mo" : "yr"}
            subtitle="Perfect for solo IT consultants and small MSPs getting started."
            popular={false}
          >
            <OfferList text="Up to 3 Team Members" status="active" />
            <OfferList text="CRM & Lead Pipeline" status="active" />
            <OfferList text="Project Kanban Board" status="active" />
            <OfferList text="Basic Invoicing" status="active" />
            <OfferList text="Cloudflare Turnstile" status="active" />
            <OfferList text="MFA / TOTP Security" status="inactive" />
          </PricingBox>
          <PricingBox
            packageName="Professional"
            price={isMonthly ? "149" : "1430"}
            duration={isMonthly ? "mo" : "yr"}
            subtitle="For growing MSPs that need full billing automation and security."
            popular={true}
          >
            <OfferList text="Up to 15 Team Members" status="active" />
            <OfferList text="Advanced CRM with Analytics" status="active" />
            <OfferList text="Automated Billing Engine" status="active" />
            <OfferList text="PDF Invoice Generation" status="active" />
            <OfferList text="MFA / TOTP + Session Mgmt" status="active" />
            <OfferList text="Field-Level Encryption" status="inactive" />
          </PricingBox>
          <PricingBox
            packageName="Enterprise"
            price={isMonthly ? "399" : "3830"}
            duration={isMonthly ? "mo" : "yr"}
            subtitle="Unlimited scale for established MSPs with enterprise compliance needs."
            popular={false}
          >
            <OfferList text="Unlimited Team Members" status="active" />
            <OfferList text="Full CRM + Billing Suite" status="active" />
            <OfferList text="Cloudflare Tunnel Ingress" status="active" />
            <OfferList text="Field-Level Encryption" status="active" />
            <OfferList text="SSO / SAML Integration" status="active" />
            <OfferList text="Priority Support & SLA" status="active" />
          </PricingBox>
        </div>
      </div>
    </section>
  );
};

export default Pricing;

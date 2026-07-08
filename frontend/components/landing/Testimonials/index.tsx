"use client";

import { motion } from "framer-motion";
import { Testimonial } from "@/types/testimonial";
import SectionTitle from "../Common/SectionTitle";
import SingleTestimonial from "./SingleTestimonial";

const testimonialData: Testimonial[] = [
  {
    id: 1,
    name: "Sarah Mitchell",
    designation: "Operations Director, NovaTech MSP",
    content:
      "ForgeFlow replaced four separate tools for us. CRM, invoicing, project tracking, and client portals — all in one place. Our billing accuracy improved by 40% in the first month.",
    image: "",
    star: 5,
  },
  {
    id: 2,
    name: "James Chen",
    designation: "Founder, CloudBridge IT",
    content:
      "The automated billing engine is a game-changer. We went from spending 8 hours a week on invoicing to fully automated runs. The multi-tenant isolation gives our clients peace of mind.",
    image: "",
    star: 5,
  },
  {
    id: 3,
    name: "Priya Sharma",
    designation: "CTO, ManagedOps Group",
    content:
      "The security architecture is enterprise-grade — MFA, field encryption, Cloudflare tunnel integration. We passed our SOC 2 audit with flying colors thanks to ForgeFlow's built-in controls.",
    image: "",
    star: 5,
  },
];

const Testimonials = () => {
  return (
    <section className="landing-section-alt relative z-10 py-16 md:py-20 lg:py-28">
      <div className="container">
        <SectionTitle
          title="Trusted by IT Service Providers"
          paragraph="See how MSPs and IT consultants are transforming their operations with ForgeFlow's unified platform."
          center
        />

        <div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
          {testimonialData.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.12 }}
            >
              <SingleTestimonial testimonial={testimonial} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

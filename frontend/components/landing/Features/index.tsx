"use client";

import { motion } from "framer-motion";
import SectionTitle from "../Common/SectionTitle";
import SingleFeature from "./SingleFeature";
import featuresData from "./featuresData";

const Features = () => {
  return (
    <>
      <section id="features" className="landing-section py-16 md:py-20 lg:py-28">
        <div className="container">
          <SectionTitle
            title="Everything Your MSP Needs"
            paragraph="From client acquisition to invoice collection, ForgeFlow unifies every operational workflow into a single, secure platform built for IT service providers."
            center
          />

          <div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
            {featuresData.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <SingleFeature feature={feature} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Features;

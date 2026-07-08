"use client";

import { motion } from "framer-motion";
import SectionTitle from "../Common/SectionTitle";
import SingleBlog from "./SingleBlog";
import blogData from "./blogData";

const Blog = () => {
  return (
    <section
      id="blog"
      className="landing-section-alt py-16 md:py-20 lg:py-28"
    >
      <div className="container">
        <SectionTitle
          title="From the ForgeFlow Engineering Blog"
          paragraph="Insights on MSP operations, billing automation, security architecture, and building production-grade SaaS platforms."
          center
        />

        <div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 md:gap-x-6 lg:gap-x-8 xl:grid-cols-3">
          {blogData.map((blog, index) => (
            <motion.div
              key={blog.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="w-full"
            >
              <SingleBlog blog={blog} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Blog;

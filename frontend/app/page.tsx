"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

// Template landing page components
import ScrollUp from "@/components/landing/Common/ScrollUp";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import Video from "@/components/landing/Video";
import Brands from "@/components/landing/Brands";
import AboutSectionOne from "@/components/landing/About/AboutSectionOne";
import AboutSectionTwo from "@/components/landing/About/AboutSectionTwo";
import Testimonials from "@/components/landing/Testimonials";
import Pricing from "@/components/landing/Pricing";
import Blog from "@/components/landing/Blog";
import Contact from "@/components/landing/Contact";

export default function Home() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0c0a09]">
        <Loader2 className="size-8 text-primary animate-spin" />
      </div>
    );
  }

  // Root path '/' ALWAYS renders the public landing page of the platform
  return (
    <>
      <ScrollUp />
      <Hero />
      <Features />
      <Video />
      <Brands />
      <AboutSectionOne />
      <AboutSectionTwo />
      <Testimonials />
      <Pricing />
      <Blog />
      <Contact />
    </>
  );
}

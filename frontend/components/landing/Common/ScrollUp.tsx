"use client";

import { useEffect } from "react";

export default function ScrollUp() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0 });
    }
  }, []);

  return null;
}

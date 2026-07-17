"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import "react-modal-video/css/modal-video.css";
import ThemeInitializer from "@/components/theme-provider";
import LayoutWrapper from "@/components/layout-wrapper";
import { StoreHydration } from "@/components/store-hydration";
import { ThemeProvider } from "next-themes";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import dynamic from "next/dynamic";
import { LiquidGlassFilter } from "@/components/glass/LiquidGlassFilter";

const ReactQueryDevtools = dynamic(
  () =>
    import("@tanstack/react-query-devtools").then(
      (df) => df.ReactQueryDevtools
    ),
  { ssr: false }
);

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning lang="en" className={`${inter.variable} h-full antialiased`}>
      <head />
      <body className="min-h-full flex flex-col text-foreground">
        <LiquidGlassFilter />
        <QueryClientProvider client={queryClient}>
          <ThemeProvider attribute="class" enableSystem={false} defaultTheme="dark">
            <StoreHydration />
            <ThemeInitializer />
            <LayoutWrapper>{children}</LayoutWrapper>
          </ThemeProvider>
          {process.env.NODE_ENV === "development" && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </QueryClientProvider>
      </body>
    </html>
  );
}

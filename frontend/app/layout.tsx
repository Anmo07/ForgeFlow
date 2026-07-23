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
      (df) => ({ default: df.ReactQueryDevtools })
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
      <head>
        <title>ForgeFlow | MSP Command Center & Billing Automation</title>
        <meta name="description" content="The unified command center and billing automation engine for modern IT Managed Service Providers." />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta property="og:title" content="ForgeFlow — MSP Command Center" />
        <meta property="og:description" content="The unified command center and billing automation engine for modern IT Managed Service Providers." />
        <meta property="og:image" content="/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="/og-image.png" />
      </head>
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

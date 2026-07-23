import type { NextConfig } from "next";
import path from "path";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  output: "standalone",
  productionBrowserSourceMaps: true,
  outputFileTracingRoot: path.join(__dirname),
  eslint: {
    // `next lint` is deprecated; we run `eslint` via `npm run lint` instead.
    // This prevents Next build output from being noisy/misleading due to lint runner changes.
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/:path*`,
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);

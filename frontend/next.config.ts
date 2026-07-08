import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: true,
  eslint: {
    // `next lint` is deprecated; we run `eslint` via `npm run lint` instead.
    // This prevents Next build output from being noisy/misleading due to lint runner changes.
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;

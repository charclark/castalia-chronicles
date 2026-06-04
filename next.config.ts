import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output bundles only the files needed for production,
  // which keeps Railway deployments lean.
  output: "standalone",
};

export default nextConfig;

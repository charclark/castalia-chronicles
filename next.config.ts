import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Do NOT use output:"standalone" on Railway — Railway runs a full Node
  // environment and doesn't need the standalone bundle.  Standalone mode
  // uses file-tracing to copy a minimal subset of node_modules, and native
  // pg bindings required by @prisma/adapter-pg are frequently missed,
  // causing all DB queries to fail at runtime even though the build passes.
};

export default nextConfig;

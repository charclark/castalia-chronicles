import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Do NOT use output:"standalone" on Railway — Railway runs a full Node
  // environment and doesn't need the standalone bundle.  Standalone mode
  // uses file-tracing to copy a minimal subset of node_modules, and native
  // pg bindings required by @prisma/adapter-pg are frequently missed,
  // causing all DB queries to fail at runtime even though the build passes.

  // Exclude Prisma and pg from Next.js bundling.
  // The generated Prisma client uses `import.meta.url` to locate its runtime
  // files. When bundled by webpack/turbopack, `import.meta.url` becomes a
  // synthetic webpack:// URL, causing `fileURLToPath()` to throw at startup.
  // Marking these as external means Node.js loads them directly from
  // node_modules at runtime, bypassing the bundler entirely.
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"],
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Transpile Proton SDK which ships CJS/ESM mixed modules
  transpilePackages: ["@proton/web-sdk"],
};

export default nextConfig;

import type { NextConfig } from "next";
const config: NextConfig = {
  // Preserve PDF.js's worker resolution and Node module loading in the server runtime.
  serverExternalPackages: ["pdf-parse", "mammoth"],
};
export default config;

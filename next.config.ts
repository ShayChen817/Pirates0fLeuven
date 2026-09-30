import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Do not let `next dev` append its own block to the team's AGENTS.md.
  agentRules: false,
};

export default nextConfig;

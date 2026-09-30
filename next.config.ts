import type { NextConfig } from 'next';

const dev = process.env.NODE_ENV !== 'production';

// No external origins are needed: fonts are self-hosted, there is no API or analytics.
// Next.js injects inline bootstrap scripts, so 'unsafe-inline' is required without nonces;
// `next dev` additionally needs eval and a websocket for hot reload.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  `connect-src 'self'${dev ? ' ws: wss:' : ''}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const nextConfig: NextConfig = {
  // STATIC_EXPORT=1 writes a plain static site to out/ (used for quick Vercel deploys from Windows).
  // Headers then come from out/vercel.json instead of headers() below.
  ...(process.env.STATIC_EXPORT === '1' ? { output: 'export' as const } : {}),
  reactStrictMode: true,
  poweredByHeader: false,
  // Do not let `next dev` append its own block to the team's AGENTS.md.
  agentRules: false,
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'Content-Security-Policy', value: csp },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'no-referrer' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
        { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
      ],
    }];
  },
};

export default nextConfig;

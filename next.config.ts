import type { NextConfig } from 'next';

// Next.js injects inline bootstrap/hydration scripts, and every route here is
// statically prerendered (SSG). A per-request CSP nonce would force dynamic
// rendering and is therefore incompatible with this static model, so
// 'unsafe-inline' is required for script-src. 'unsafe-eval' is additionally
// needed only by the dev server (React Refresh) and is dropped in production.
const scriptSource = process.env.NODE_ENV === 'production'
  ? "script-src 'self' 'unsafe-inline';"
  : "script-src 'self' 'unsafe-inline' 'unsafe-eval';";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'Content-Security-Policy', value: `default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; ${scriptSource} connect-src 'self'; font-src 'self';` },
        { key: 'Permissions-Policy', value: 'camera=(), geolocation=(), microphone=(), payment=(), usb=()' },
        { key: 'Referrer-Policy', value: 'no-referrer' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
      ],
    }];
  },
  async redirects() {
    return [
      { source: '/certifications/osa', destination: '/certifications/osda', permanent: true },
    ];
  },
};

export default nextConfig;

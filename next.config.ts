import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/runtime/manifest.json',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      {
        source: '/runtime/:version/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },
  // Keep browser-test dev output separate from a developer's running server.
  distDir:
    process.env.PLAYWRIGHT_PREVIEW === 'true' ? '.next-preview' : '.next',
  typescript: {
    tsconfigPath:
      process.env.PLAYWRIGHT_PREVIEW === 'true'
        ? 'tsconfig.preview.json'
        : 'tsconfig.json',
  },
};

export default nextConfig;

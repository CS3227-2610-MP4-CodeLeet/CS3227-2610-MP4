import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
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

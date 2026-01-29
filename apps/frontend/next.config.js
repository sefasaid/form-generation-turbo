/** @type {import('next').NextConfig} */
const path = require('path');
const { config } = require('dotenv');

// Load .env from root directory
config({ path: path.resolve(__dirname, '../../.env') });

const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },
  // Turbopack config for Next.js 16
  turbopack: {
    resolveAlias: {
      '@repo/nextFetch': '../../packages/nextFetch/src/index.ts',
    },
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
  // Fallback webpack config (will be ignored if Turbopack is used)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@repo/nextFetch': path.resolve(__dirname, '../../packages/nextFetch/src/index.ts'),
      };
    }
    return config;
  },
};

module.exports = nextConfig;
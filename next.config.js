/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep serverless functions under 250 MB: load these from node_modules at runtime instead of bundling
  serverExternalPackages: [
    'sharp',
    'ag-psd',
    'canvas',
    '@prisma/client',
  ],
  // Enable file uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  webpack: (config, { isServer }) => {
    // Exclude Node.js built-in modules from client-side bundles
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig

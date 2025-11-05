/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  // For Capacitor: use static export for production builds
  // For development, keep server mode and use server.url in capacitor.config.json
  // output: 'export', // Uncomment this for static export builds
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    };
    return config;
  },
}

module.exports = nextConfig


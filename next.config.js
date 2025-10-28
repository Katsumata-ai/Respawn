/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    turbopack: {
      resolveAlias: {
        '@': './',
      },
    },
  },
};

module.exports = nextConfig;


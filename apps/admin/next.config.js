/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/admin',
  reactStrictMode: true,
  generateBuildId: () => Date.now().toString(36),
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;

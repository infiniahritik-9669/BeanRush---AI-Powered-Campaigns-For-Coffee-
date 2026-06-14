/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["prisma", "@prisma/client"],
  },
};

module.exports = nextConfig;

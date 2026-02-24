/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3"],
  },
  webpack: (config) => {
    // Disable persistent cache in production to avoid stale Docker cache mount issues
    if (process.env.NODE_ENV === "production") {
      config.cache = false;
    }
    return config;
  },
};

module.exports = nextConfig;

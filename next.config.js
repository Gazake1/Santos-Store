/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3"],
  },
  async rewrites() {
    return [
      // Serve uploaded files via API (handles old /uploads/* URLs in DB)
      { source: "/uploads/:path*", destination: "/api/uploads/:path*" },
    ];
  },
};

module.exports = nextConfig;

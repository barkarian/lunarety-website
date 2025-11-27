import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  images: {
    // In development, localhost resolves to private IP which Next.js blocks
    // So we disable optimization for dev. In production, optimization works normally.
    unoptimized: isDev,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/api/media/**",
      },
      {
        protocol: "https",
        hostname: "lunarety.com",
        pathname: "/api/media/**",
      },
      {
        protocol: "https",
        hostname: "*.lunarety.com",
        pathname: "/api/media/**",
      },
    ],
  },
};

export default nextConfig;

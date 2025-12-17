import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    APP_BASE_URL:
      process.env.VERCEL_ENV === "preview"
        ? `https://${process.env.VERCEL_BRANCH_URL}`
        : process.env.APP_BASE_URL,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "maps.googleapis.com",
        pathname: "/maps/api/staticmap/**",
      },
    ],
  },
};

export default nextConfig;

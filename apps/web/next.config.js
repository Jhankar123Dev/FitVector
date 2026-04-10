const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Defender excludes node_modules from real-time scanning — placing the
  // build cache here avoids the EPERM atomic-rename failures on corporate
  // Windows machines (Cognizant/Avecto policy).
  distDir: "node_modules/.cache/next-build",
  reactStrictMode: true,
  transpilePackages: ["@fitvector/shared"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

module.exports = withPWA(nextConfig);

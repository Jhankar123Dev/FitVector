const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // On Vercel use the standard .next output directory.
  // Locally on corporate Windows (Cognizant/Avecto), Defender blocks atomic
  // renames in the project root, so we redirect the build cache into
  // node_modules which is excluded from real-time scanning.
  distDir: process.env.VERCEL ? ".next" : "node_modules/.cache/next-build",
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

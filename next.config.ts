import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Prisma's query engine out of the Next bundle so Vercel functions
  // can load it. Without this, authorize()'s first query throws and Auth.js
  // surfaces CallbackRouteError on /api/demo-enter.
  serverExternalPackages: ["@prisma/client", "prisma"],
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/.prisma/client/**",
      "./node_modules/@prisma/client/**",
    ],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "a.espncdn.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
    ],
  },
  // Do not reuse another user's RSC payload on client-side nav.
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Vary",
            value: "Cookie",
          },
        ],
      },
      {
        source: "/((?!_next/static|_next/image|icons/|favicon.ico|apple-touch-icon.png|manifest.webmanifest|sw.js).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-store, no-cache, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

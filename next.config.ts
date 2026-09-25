import type { NextConfig } from "next";

/**
 * Vercel (Amazon Linux) query engine + schema. Prisma loads these at
 * runtime; webpack must not bundle them. NFT follows the generated
 * path.join() hints for any route that imports @prisma/client — these
 * includes are a safety net for auth / API / cron only.
 */
const vercelPrismaEngine = [
  "./node_modules/.prisma/client/libquery_engine-rhel-openssl-3.0.x.so.node",
  "./node_modules/.prisma/client/schema.prisma",
];

const nextConfig: NextConfig = {
  // Keep Prisma out of the webpack bundle so the native query engine can
  // load. Without this, authorize() throws and Auth.js surfaces
  // CallbackRouteError on /api/demo-enter.
  serverExternalPackages: ["@prisma/client"],
  // Next matches these keys with picomatch { contains: true }. A "/*"
  // glob of the whole @prisma/client tree copied ~49 MB (two engines +
  // unused WASM) into every function — including favicon and _error —
  // and drove Hobby Functions Storage past 10 GB.
  outputFileTracingIncludes: {
    "/api/": vercelPrismaEngine,
    instrumentation: vercelPrismaEngine,
  },
  outputFileTracingExcludes: {
    "*": [
      "./node_modules/.prisma/client/libquery_engine-debian*",
      "./node_modules/.prisma/client/libquery_engine-linux-musl*",
      "./node_modules/.prisma/client/libquery_engine-darwin*",
      "./node_modules/.prisma/client/libquery_engine-windows*",
      "./node_modules/@prisma/client/runtime/*.wasm",
      "./node_modules/@prisma/client/runtime/query_engine_bg.*",
      "./node_modules/@prisma/client/runtime/query_compiler_bg.*",
      "./node_modules/@prisma/client/runtime/react-native*",
      "./node_modules/@prisma/client/runtime/edge*",
      "./node_modules/@prisma/client/runtime/wasm*",
      "./node_modules/@prisma/client/generator-build/**",
      "./node_modules/@prisma/engines/**",
      "./node_modules/prisma/**",
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
    const dynamic =
      "/((?!_next/static|_next/image|icons/|helmets/|favicon.ico|manifest.webmanifest|sw.js).*)";
    const immutable = "public, max-age=86400, stale-while-revalidate=604800";
    return [
      {
        // Personalized HTML/RSC only. Vary: Cookie + no-store on /helmets
        // and /_next/static forced a fresh origin fetch per image per paint.
        source: dynamic,
        headers: [
          { key: "Vary", value: "Cookie" },
          {
            key: "Cache-Control",
            value: "private, no-store, no-cache, must-revalidate",
          },
        ],
      },
      {
        source: "/helmets/:path*",
        headers: [{ key: "Cache-Control", value: immutable }],
      },
      {
        source: "/icons/:path*",
        headers: [{ key: "Cache-Control", value: immutable }],
      },
      {
        source: "/favicon.ico",
        headers: [{ key: "Cache-Control", value: immutable }],
      },
    ];
  },
};

export default nextConfig;

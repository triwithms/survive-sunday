import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isLoopbackHost } from "@/lib/request-host";

/**
 * Cloudflared often sends x-forwarded-proto=https but leaves Auth.js / Next
 * resolving the origin as localhost (listen address or leftover AUTH_URL).
 * When Host is a public hostname, force x-forwarded-host / proto so Auth.js
 * trustHost uses the request Host (e.g. *.trycloudflare.com).
 */
export function middleware(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(",")[0].trim();
  if (!host || isLoopbackHost(host)) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-forwarded-host", host);

  const existingProto = (request.headers.get("x-forwarded-proto") ?? "")
    .split(",")[0]
    .trim();
  const proto =
    existingProto ||
    (host.endsWith("trycloudflare.com") || request.headers.get("cf-visitor")
      ? "https"
      : request.nextUrl.protocol.replace(":", "") || "https");
  requestHeaders.set("x-forwarded-proto", proto);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|icons/|favicon.ico|manifest.webmanifest|sw.js).*)",
  ],
};

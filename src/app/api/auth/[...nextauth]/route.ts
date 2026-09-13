import type { NextRequest } from "next/server";
import { handlers } from "@/lib/auth";
import {
  requestWithPublicOrigin,
  rewriteAuthResponse,
} from "@/lib/request-host";

async function handle(method: "GET" | "POST", req: NextRequest) {
  const forwarded = requestWithPublicOrigin(req);
  const res = await handlers[method](forwarded as NextRequest);
  return rewriteAuthResponse(req, res);
}

export function GET(req: NextRequest) {
  return handle("GET", req);
}

export function POST(req: NextRequest) {
  return handle("POST", req);
}

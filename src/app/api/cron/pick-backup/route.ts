import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { applyMirrorPicksForActiveWeeks } from "@/lib/pick-mirror-db";

export const dynamic = "force-dynamic";
export const revalidate = 0;
/** Daily windows: 16:55 UTC (12:55 p.m. ET) and 00:10 UTC (8:10 p.m. ET). */
export const maxDuration = 60;

export async function GET(req: Request) {
  if (!cronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await applyMirrorPicksForActiveWeeks();
  return NextResponse.json({ ok: true, ...result });
}

export async function POST(req: Request) {
  return GET(req);
}

import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { runDueWeekWraps } from "@/lib/week-wrap-run";

export const dynamic = "force-dynamic";
export const revalidate = 0;
/** 12:00 UTC = 8:00 a.m. EDT / 7:00 a.m. EST (morning America/Toronto). */
export const maxDuration = 60;

export async function GET(req: Request) {
  if (!cronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await runDueWeekWraps();
  return NextResponse.json({ ok: true, ...result });
}

export async function POST(req: Request) {
  return GET(req);
}

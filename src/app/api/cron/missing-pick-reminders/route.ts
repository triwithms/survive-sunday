import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { sendMissingPickReminders } from "@/lib/notification-reminders";

export async function GET(req: Request) {
  if (!cronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Default mode is cron: the 24h window stays on this path.
  const result = await sendMissingPickReminders();
  return NextResponse.json({ ok: true, ...result });
}

export async function POST(req: Request) {
  return GET(req);
}

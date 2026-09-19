import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { parsePreferencePatch } from "@/lib/notification-types";
import { loadNotifyPref } from "@/lib/notify-pref-db";
import { saveNotifyState } from "@/lib/notify-pref-save";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const loaded = await loadNotifyPref(session.user.id);
  return NextResponse.json({ ok: true, prefs: loaded.prefs });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const loaded = await loadNotifyPref(session.user.id);
  const parsed = parsePreferencePatch(body, loaded.prefs);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const prefs = await saveNotifyState(session.user.id, parsed.prefs);
  return NextResponse.json({ ok: true, prefs });
}

export async function POST(req: Request) {
  return PATCH(req);
}

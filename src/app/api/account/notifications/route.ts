import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { parseNotifyPrefBody } from "@/lib/notify-pref";
import { loadNotifyPref, saveNotifyPref } from "@/lib/notify-pref-db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const loaded = await loadNotifyPref(session.user.id);
  return NextResponse.json({ ok: true, pref: loaded.pref });
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
  const parsed = parseNotifyPrefBody(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const pref = await saveNotifyPref(session.user.id, parsed.pref);
  return NextResponse.json({ ok: true, pref });
}

export async function POST(req: Request) {
  return PATCH(req);
}

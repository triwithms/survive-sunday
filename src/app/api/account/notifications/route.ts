import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  ensureNotificationPrefsSafe,
  saveNotificationPrefsSafe,
} from "@/lib/notification-prefs";
import { parsePreferencePatch } from "@/lib/notification-types";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { prefs, error } = await ensureNotificationPrefsSafe(session.user.id);
  return NextResponse.json({ ok: !error, prefs, error });
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
  const parsed = parsePreferencePatch(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { prefs, error } = await saveNotificationPrefsSafe(
    session.user.id,
    parsed.prefs
  );
  if (error) {
    return NextResponse.json({ error, prefs }, { status: 503 });
  }
  return NextResponse.json({ ok: true, prefs });
}

export async function POST(req: Request) {
  return PATCH(req);
}

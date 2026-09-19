import { NextResponse } from "next/server";
import { parseRosterProfile } from "@/lib/roster-profile";
import { saveRosterProfile } from "@/lib/roster-profile-db";
import { requireAdmin } from "@/lib/session";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseRosterProfile(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }

  const result = await saveRosterProfile(admin, parsed.value);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true, membership: result.membership });
}

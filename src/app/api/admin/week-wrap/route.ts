import { NextResponse } from "next/server";

export const maxDuration = 60;
import { requireAdmin } from "@/lib/session";
import { applyWeekWrapAction } from "@/lib/week-wrap-admin";
import { parseWeekWrapRequest } from "@/lib/week-wrap-request";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = parseWeekWrapRequest(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const result = await applyWeekWrapAction({
    poolId: admin.membership.poolId,
    actorId: admin.user.id,
    request: parsed.value,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}

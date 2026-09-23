import { NextResponse } from "next/server";
import { listAdminMissingPicks } from "@/lib/missing-pick-list";
import { sendMissingPickReminders } from "@/lib/notification-reminders";
import { requireAdmin } from "@/lib/session";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const data = await listAdminMissingPicks(admin.membership.poolId);
  return NextResponse.json({ ok: true, ...data });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const result = await sendMissingPickReminders({
    poolId: admin.membership.poolId,
    weekId: await readWeekId(req),
    mode: "admin",
    actorId: admin.user.id,
  });
  return NextResponse.json({ ok: true, ...result });
}

async function readWeekId(req: Request): Promise<string | undefined> {
  try {
    const body = (await req.json()) as { weekId?: unknown };
    return typeof body.weekId === "string" && body.weekId ? body.weekId : undefined;
  } catch {
    return undefined;
  }
}

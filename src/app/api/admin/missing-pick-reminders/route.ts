import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { sendMissingPickReminders } from "@/lib/notification-reminders";

export async function POST() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const result = await sendMissingPickReminders({
    poolId: admin.membership.poolId,
  });
  return NextResponse.json({ ok: true, ...result });
}

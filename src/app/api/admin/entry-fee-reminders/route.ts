import { NextResponse } from "next/server";
import { sendEntryFeeReminders } from "@/lib/payment-remind";
import { requireAdmin } from "@/lib/session";

export async function POST() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const result = await sendEntryFeeReminders({
    poolId: admin.membership.poolId,
    actorId: admin.user.id,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}

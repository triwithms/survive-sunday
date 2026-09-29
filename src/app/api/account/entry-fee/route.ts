import { NextResponse } from "next/server";
import { entryFeeForViewer, playerMayReadPayment } from "@/lib/payment-tracking";
import { getUserPoolContext, requireUser } from "@/lib/session";

/** The signed-in player only. Query ids for someone else are refused. */
export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const requested = new URL(req.url).searchParams.get("userId");
  if (!playerMayReadPayment({ viewerUserId: user.id, requestedUserId: requested })) {
    return NextResponse.json(
      { error: "You can only see your own entry fee." },
      { status: 403 }
    );
  }
  const ctx = await getUserPoolContext(user.id);
  const me = ctx.membership;
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const view = entryFeeForViewer(user.id, {
    userId: me.userId,
    enabled: me.pool.paymentTrackingEnabled,
    status: me.paymentStatus,
    instructions: me.pool.paymentInstructions,
    link: me.pool.paymentLink,
  });
  if (!view) {
    return NextResponse.json(
      { error: "You can only see your own entry fee." },
      { status: 403 }
    );
  }
  return NextResponse.json({ ok: true, entryFee: view });
}

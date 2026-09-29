import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/db";
import { revokePoolInvite, rotatePoolInvite } from "@/lib/pool-invite-db";

/** Mint or turn off this admin's pool link. The pool id is the membership, not the body. */
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const poolId = admin.membership.poolId;
  const body = (await req.json().catch(() => ({}))) as { action?: unknown };
  const action = body.action === "revoke" ? "revoke" : "rotate";
  if (action === "revoke") {
    await revokePoolInvite(poolId);
    await prisma.auditLog.create({
      data: {
        poolId,
        actorId: admin.user.id,
        action: "pool_invite_revoked",
        targetType: "pool",
        targetId: poolId,
      },
    });
    return NextResponse.json({ ok: true, active: false });
  }
  const minted = await rotatePoolInvite(poolId);
  await prisma.auditLog.create({
    data: {
      poolId,
      actorId: admin.user.id,
      action: "pool_invite_rotated",
      targetType: "pool",
      targetId: poolId,
    },
  });
  return NextResponse.json({ ok: true, active: true, url: minted.url });
}

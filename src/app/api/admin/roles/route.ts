import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { canDemoteAdmin, isAdministrator, isPlayerSeat } from "@/lib/roles";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as {
    membershipId?: unknown;
    action?: unknown;
  };
  const membershipId =
    typeof body.membershipId === "string" ? body.membershipId.trim() : "";
  const action = body.action === "promote" || body.action === "demote" ? body.action : "";
  if (!membershipId || !action) {
    return NextResponse.json({ error: "Pick a person and an action" }, { status: 400 });
  }

  const target = await prisma.membership.findFirst({
    where: { id: membershipId, poolId: admin.membership.poolId },
  });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isPlayerSeat(target)) {
    return NextResponse.json(
      { error: "That seat is the commissioner spectator, not a player." },
      { status: 400 }
    );
  }

  const poolMembers = await prisma.membership.findMany({
    where: { poolId: admin.membership.poolId },
    select: { role: true, isAdmin: true, userId: true },
  });

  if (action === "promote") {
    if (isAdministrator(target)) {
      return NextResponse.json({ ok: true, already: true });
    }
    await prisma.membership.update({
      where: { id: target.id },
      data: { isAdmin: true },
    });
    await prisma.auditLog.create({
      data: {
        poolId: admin.membership.poolId,
        actorId: admin.user.id,
        action: "grant_admin",
        targetType: "membership",
        targetId: target.id,
        details: JSON.stringify({
          nickname: target.nickname,
          note: "Administrator role granted; player seat unchanged",
        }),
      },
    });
    return NextResponse.json({ ok: true, action: "promote", nickname: target.nickname });
  }

  if (!isAdministrator(target)) {
    return NextResponse.json({ ok: true, already: true });
  }
  if (!canDemoteAdmin(poolMembers, target.userId)) {
    return NextResponse.json(
      { error: "The pool needs at least one administrator." },
      { status: 400 }
    );
  }

  await prisma.membership.update({
    where: { id: target.id },
    data: { isAdmin: false },
  });
  await prisma.auditLog.create({
    data: {
      poolId: admin.membership.poolId,
      actorId: admin.user.id,
      action: "revoke_admin",
      targetType: "membership",
      targetId: target.id,
      details: JSON.stringify({
        nickname: target.nickname,
        note: "Administrator role removed; they stay as a player",
      }),
    },
  });
  return NextResponse.json({ ok: true, action: "demote", nickname: target.nickname });
}

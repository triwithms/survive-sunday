import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { membershipId } = await req.json();
  if (!membershipId) {
    return NextResponse.json({ error: "membershipId required" }, { status: 400 });
  }
  if (membershipId === admin.membership.id) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
  }

  const target = await prisma.membership.findFirst({
    where: { id: membershipId, poolId: admin.membership.poolId },
  });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.pick.deleteMany({ where: { membershipId } });
  await prisma.membership.delete({ where: { id: membershipId } });

  await prisma.auditLog.create({
    data: {
      poolId: admin.membership.poolId,
      actorId: admin.user.id,
      action: "remove_player",
      targetType: "membership",
      targetId: membershipId,
      details: JSON.stringify({ nickname: target.nickname }),
    },
  });

  return NextResponse.json({ ok: true });
}

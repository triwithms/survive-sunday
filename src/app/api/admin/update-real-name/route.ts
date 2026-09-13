import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

const MAX_REAL_NAME = 80;

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { membershipId?: unknown; realName?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const membershipId =
    typeof body.membershipId === "string" ? body.membershipId.trim() : "";
  if (!membershipId) {
    return NextResponse.json({ error: "membershipId required" }, { status: 400 });
  }

  const realName =
    typeof body.realName === "string" ? body.realName.trim() : "";
  if (realName.length > MAX_REAL_NAME) {
    return NextResponse.json(
      { error: `Real name must be ${MAX_REAL_NAME} characters or fewer` },
      { status: 400 }
    );
  }

  const target = await prisma.membership.findFirst({
    where: { id: membershipId, poolId: admin.membership.poolId },
  });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.membership.update({
    where: { id: membershipId },
    data: { realName: realName || null },
    select: { id: true, nickname: true, realName: true },
  });

  await prisma.auditLog.create({
    data: {
      poolId: admin.membership.poolId,
      actorId: admin.user.id,
      action: "update_real_name",
      targetType: "membership",
      targetId: membershipId,
      details: JSON.stringify({
        nickname: target.nickname,
        from: target.realName,
        to: updated.realName,
      }),
    },
  });

  return NextResponse.json({ ok: true, membership: updated });
}

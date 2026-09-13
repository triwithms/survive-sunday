import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

const MAX_NICKNAME = 24;
const MAX_REAL_NAME = 80;

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { membershipId?: unknown; nickname?: unknown; realName?: unknown };
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

  const nickname =
    typeof body.nickname === "string" ? body.nickname.trim() : "";
  if (!nickname) {
    return NextResponse.json({ error: "Nickname can’t be empty" }, { status: 400 });
  }
  if (nickname.length > MAX_NICKNAME) {
    return NextResponse.json(
      { error: `Nickname must be ${MAX_NICKNAME} characters or fewer` },
      { status: 400 }
    );
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

  if (nickname.toLowerCase() !== target.nickname.toLowerCase()) {
    const poolMembers = await prisma.membership.findMany({
      where: { poolId: admin.membership.poolId },
      select: { id: true, nickname: true },
    });
    const taken = poolMembers.some(
      (m) =>
        m.id !== target.id &&
        m.nickname.toLowerCase() === nickname.toLowerCase()
    );
    if (taken) {
      return NextResponse.json(
        { error: "That nickname is already taken in this pool" },
        { status: 409 }
      );
    }
  }

  try {
    const updated = await prisma.membership.update({
      where: { id: membershipId },
      data: {
        nickname,
        realName: realName || null,
      },
      select: { id: true, nickname: true, realName: true },
    });

    await prisma.auditLog.create({
      data: {
        poolId: admin.membership.poolId,
        actorId: admin.user.id,
        action: "update_roster",
        targetType: "membership",
        targetId: membershipId,
        details: JSON.stringify({
          from: { nickname: target.nickname, realName: target.realName },
          to: { nickname: updated.nickname, realName: updated.realName },
        }),
      },
    });

    return NextResponse.json({ ok: true, membership: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("Unique constraint") || msg.includes("UNIQUE")) {
      return NextResponse.json(
        { error: "That nickname is already taken in this pool" },
        { status: 409 }
      );
    }
    throw err;
  }
}

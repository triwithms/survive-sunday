import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getMembershipForUser, isSessionReady } from "@/lib/session";

const MAX_NICKNAME = 24;

export async function PATCH(req: Request) {
  const session = await auth();
  if (!isSessionReady(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await getMembershipForUser(session.user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not in a pool" }, { status: 403 });
  }

  let body: { nickname?: unknown; realName?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const nickname =
    typeof body.nickname === "string" ? body.nickname.trim() : "";
  if (!nickname) {
    return NextResponse.json(
      { error: "Nickname can’t be empty" },
      { status: 400 }
    );
  }
  if (nickname.length > MAX_NICKNAME) {
    return NextResponse.json(
      { error: `Nickname must be ${MAX_NICKNAME} characters or fewer` },
      { status: 400 }
    );
  }

  const realNameProvided = "realName" in body;
  const realName =
    realNameProvided && typeof body.realName === "string"
      ? body.realName.trim() || null
      : undefined;

  // Same nickname (exact) — allow no-op / optional realName update
  const sameExact = nickname === membership.nickname;
  if (!sameExact) {
    // Unique within pool, case-insensitive, among all memberships (incl. admin)
    const poolMembers = await prisma.membership.findMany({
      where: { poolId: membership.poolId },
      select: { id: true, nickname: true },
    });
    const taken = poolMembers.some(
      (m) =>
        m.id !== membership.id &&
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
      where: { id: membership.id },
      data: {
        nickname,
        ...(realName !== undefined ? { realName } : {}),
      },
      select: { nickname: true, realName: true },
    });
    return NextResponse.json({
      ok: true,
      nickname: updated.nickname,
      realName: updated.realName,
    });
  } catch (err) {
    // Race on @@unique([poolId, nickname])
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

export async function POST(req: Request) {
  return PATCH(req);
}

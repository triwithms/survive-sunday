import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getMembershipForUser } from "@/lib/session";
import {
  isPickBackupMode,
  setMembershipPickBackup,
} from "@/lib/pick-mirror-db";
import {
  PICK_BACKUP_MIRROR,
  PICK_BACKUP_OFF,
  resolvePickBackupMode,
} from "@/lib/pick-mirror";
import { isPlayerSeat } from "@/lib/roles";
import { formatSeatLabel } from "@/lib/claim-seat";

async function mirrorOptions(poolId: string, exceptId: string) {
  const members = await prisma.membership.findMany({
    where: { poolId, role: { not: "admin" }, id: { not: exceptId } },
    select: { id: true, nickname: true, realName: true },
    orderBy: { nickname: "asc" },
  });
  return members.map((m) => ({
    id: m.id,
    nickname: m.nickname,
    label: formatSeatLabel(m.nickname, m.realName),
  }));
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const me = await getMembershipForUser(session.user.id);
  if (!me || !isPlayerSeat(me)) {
    return NextResponse.json({ error: "No player seat" }, { status: 403 });
  }
  const options = await mirrorOptions(me.poolId, me.id);
  const source = me.mirrorFromMembershipId
    ? options.find((o) => o.id === me.mirrorFromMembershipId) ?? null
    : null;
  return NextResponse.json({
    ok: true,
    membershipId: me.id,
    pickBackup: resolvePickBackupMode(me.pickBackup, me.mirrorFromMembershipId),
    mirrorFromMembershipId: me.mirrorFromMembershipId,
    mirrorFromNickname: source?.nickname ?? null,
    options,
  });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const me = await getMembershipForUser(session.user.id);
  if (!me || !isPlayerSeat(me)) {
    return NextResponse.json({ error: "No player seat" }, { status: 403 });
  }
  let body: { mode?: unknown; sourceMembershipId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const raw = body.sourceMembershipId;
  const sourceMembershipId =
    raw === null || raw === "" || raw === undefined
      ? null
      : typeof raw === "string"
        ? raw
        : null;
  let mode = isPickBackupMode(body.mode) ? body.mode : null;
  if (!mode) {
    mode = sourceMembershipId ? PICK_BACKUP_MIRROR : PICK_BACKUP_OFF;
  }
  if (mode === PICK_BACKUP_MIRROR && !sourceMembershipId) {
    return NextResponse.json({ error: "Choose a player to copy from" }, { status: 400 });
  }
  try {
    const updated = await setMembershipPickBackup({
      poolId: me.poolId,
      membershipId: me.id,
      mode,
      sourceMembershipId,
      actorId: session.user.id,
    });
    const options = await mirrorOptions(me.poolId, me.id);
    return NextResponse.json({ ok: true, ...updated, options });
  } catch (error) {
    const status =
      error && typeof error === "object" && "status" in error
        ? Number((error as { status?: number }).status)
        : 500;
    const message = error instanceof Error ? error.message : "Could not save";
    return NextResponse.json({ error: message }, { status: status || 500 });
  }
}

export async function POST(req: Request) {
  return PATCH(req);
}

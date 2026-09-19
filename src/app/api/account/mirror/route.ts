import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMembershipForUser } from "@/lib/session";
import {
  isPickBackupMode,
  setMembershipPickBackup,
} from "@/lib/pick-mirror-db";
import {
  PICK_BACKUP_RANKED,
  resolvePickBackupMode,
} from "@/lib/pick-mirror";
import { isPlayerSeat } from "@/lib/roles";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const me = await getMembershipForUser(session.user.id);
  if (!me || !isPlayerSeat(me)) {
    return NextResponse.json({ error: "No player seat" }, { status: 403 });
  }
  return NextResponse.json({
    ok: true,
    membershipId: me.id,
    pickBackup: resolvePickBackupMode(me.pickBackup, me.mirrorFromMembershipId),
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
  let body: { mode?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const mode = isPickBackupMode(body.mode)
    ? body.mode
    : resolvePickBackupMode(typeof body.mode === "string" ? body.mode : null);
  try {
    const updated = await setMembershipPickBackup({
      poolId: me.poolId,
      membershipId: me.id,
      mode: mode === "off" ? "off" : PICK_BACKUP_RANKED,
      actorId: session.user.id,
    });
    return NextResponse.json({ ok: true, ...updated });
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

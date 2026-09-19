import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { isPickBackupMode, setMembershipPickBackup } from "@/lib/pick-mirror-db";
import { PICK_BACKUP_RANKED, resolvePickBackupMode } from "@/lib/pick-mirror";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { membershipId?: unknown; mode?: unknown };
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

  const mode = isPickBackupMode(body.mode)
    ? body.mode
    : resolvePickBackupMode(typeof body.mode === "string" ? body.mode : null);

  try {
    const updated = await setMembershipPickBackup({
      poolId: admin.membership.poolId,
      membershipId,
      mode: mode === "off" ? "off" : PICK_BACKUP_RANKED,
      actorId: admin.user.id,
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

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { setMembershipMirrorFrom } from "@/lib/pick-mirror-db";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { membershipId?: unknown; sourceMembershipId?: unknown };
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

  const raw = body.sourceMembershipId;
  const sourceMembershipId =
    raw === null || raw === "" || raw === undefined
      ? null
      : typeof raw === "string"
        ? raw
        : null;
  if (raw !== null && raw !== "" && raw !== undefined && !sourceMembershipId) {
    return NextResponse.json({ error: "Choose a player to copy from" }, { status: 400 });
  }

  try {
    const updated = await setMembershipMirrorFrom({
      poolId: admin.membership.poolId,
      membershipId,
      sourceMembershipId,
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

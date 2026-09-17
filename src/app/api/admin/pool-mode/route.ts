import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { normalizePoolMode } from "@/lib/pool-mode";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({
    mode: normalizePoolMode(admin.membership.pool.mode),
    poolName: admin.membership.pool.name,
  });
}

/** Mode toggle removed — the pool is live-only. Does not mutate picks. */
export async function POST() {
  return NextResponse.json(
    { error: "Demo vs Real was removed. The pool is live-only." },
    { status: 410 }
  );
}

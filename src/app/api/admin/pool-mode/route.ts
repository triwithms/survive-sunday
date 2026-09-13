import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import {
  POOL_MODE_DEMO,
  POOL_MODE_LIVE,
  normalizePoolMode,
  type PoolMode,
} from "@/lib/pool-mode";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({
    mode: normalizePoolMode(admin.membership.pool.mode),
    poolName: admin.membership.pool.name,
  });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const requested = body.mode as string | undefined;
  if (requested !== POOL_MODE_DEMO && requested !== POOL_MODE_LIVE) {
    return NextResponse.json(
      { error: "mode must be demo or live" },
      { status: 400 }
    );
  }

  const mode: PoolMode = requested;
  const pool = await prisma.pool.update({
    where: { id: admin.membership.poolId },
    data: { mode },
  });

  await prisma.auditLog.create({
    data: {
      poolId: pool.id,
      actorId: admin.user.id,
      action: `pool_mode_${mode}`,
      targetType: "pool",
      targetId: pool.id,
      details: JSON.stringify({
        mode,
        note:
          mode === POOL_MODE_LIVE
            ? "Real mode — participant screens hide demo picker and demo wording"
            : "Demo mode — practice picker and demo accounts available",
      }),
    },
  });

  return NextResponse.json({ ok: true, mode: normalizePoolMode(pool.mode) });
}

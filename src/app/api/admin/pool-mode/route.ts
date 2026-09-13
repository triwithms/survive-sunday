import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import {
  POOL_MODE_DEMO,
  POOL_MODE_LIVE,
  isDemoEmail,
  normalizePoolMode,
  type PoolMode,
} from "@/lib/pool-mode";
import {
  applyDemoModeSandbox,
  applyRealModeIsolation,
} from "@/lib/week-isolation";

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
  const stillPracticeLogin = isDemoEmail(admin.user.email);
  const isolation =
    mode === POOL_MODE_LIVE
      ? await applyRealModeIsolation(prisma, admin.membership.poolId)
      : await applyDemoModeSandbox(prisma, admin.membership.poolId);

  const pool = await prisma.pool.findUniqueOrThrow({
    where: { id: admin.membership.poolId },
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
        currentWeek: isolation.currentWeek,
        clearedSandboxPicks: isolation.clearedPicks,
        stillPracticeLogin,
        note:
          mode === POOL_MODE_LIVE
            ? "Real mode — Week 1 current; Week 2 slate kept; no participant demo UX"
            : "Demo mode — practice picker available; Week 2 slate kept",
      }),
    },
  });

  return NextResponse.json({
    ok: true,
    mode: normalizePoolMode(pool.mode),
    currentWeek: pool.currentWeek,
    clearedSandboxPicks: isolation.clearedPicks,
  });
}

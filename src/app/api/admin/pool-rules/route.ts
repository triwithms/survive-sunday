import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import {
  parseSingleEliminationWeek,
  poolRulesAdminSummary,
  poolRulesPlayerLabel,
} from "@/lib/pool-rules";
import { effectiveCurrentWeek } from "@/lib/pool-mode";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const pool = await prisma.pool.findUniqueOrThrow({
    where: { id: admin.membership.poolId },
  });

  return NextResponse.json({
    ok: true,
    currentWeek: effectiveCurrentWeek(pool.mode, pool.currentWeek),
    singleEliminationFromWeek: pool.singleEliminationFromWeek,
    summary: poolRulesAdminSummary(pool.singleEliminationFromWeek),
    playerLabel: poolRulesPlayerLabel(pool.singleEliminationFromWeek),
  });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const parsed = parseSingleEliminationWeek(body.singleEliminationFromWeek);
  if (body.singleEliminationFromWeek !== null && parsed === undefined) {
    return NextResponse.json(
      { error: "Choose a week from 1 to 18, or turn the mulligan back on." },
      { status: 400 }
    );
  }

  const nextFromWeek =
    body.singleEliminationFromWeek === null ? null : parsed ?? null;

  const updated = await prisma.pool.update({
    where: { id: admin.membership.poolId },
    data: { singleEliminationFromWeek: nextFromWeek },
  });

  await prisma.auditLog.create({
    data: {
      poolId: admin.membership.poolId,
      actorId: admin.user.id,
      action: "pool_rules_mulligan",
      targetType: "pool",
      targetId: updated.id,
      details: JSON.stringify({
        singleEliminationFromWeek: updated.singleEliminationFromWeek,
        previous: admin.membership.pool.singleEliminationFromWeek,
        note:
          updated.singleEliminationFromWeek == null
            ? "Restored free mulligan for weeks not yet graded"
            : `One-and-done from week ${updated.singleEliminationFromWeek}; already-graded weeks stay as they are`,
      }),
    },
  });

  return NextResponse.json({
    ok: true,
    currentWeek: effectiveCurrentWeek(updated.mode, updated.currentWeek),
    singleEliminationFromWeek: updated.singleEliminationFromWeek,
    summary: poolRulesAdminSummary(updated.singleEliminationFromWeek),
    playerLabel: poolRulesPlayerLabel(updated.singleEliminationFromWeek),
  });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import {
  gradeWeekPicks,
  ensureWeekLockedEffects,
  simulateRemainingGames,
  recomputeWeeksSurvived,
} from "@/lib/grading";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { weekNumber, gameId } = await req.json();
  const week = await prisma.week.findUnique({
    where: {
      poolId_number: {
        poolId: admin.membership.poolId,
        number: weekNumber ?? 1,
      },
    },
  });
  if (!week) return NextResponse.json({ error: "Week not found" }, { status: 404 });

  const updated = await simulateRemainingGames(week.id, { gameId });

  await ensureWeekLockedEffects(week.id);
  const graded = await gradeWeekPicks(week.id);
  await recomputeWeeksSurvived(admin.membership.poolId);

  await prisma.auditLog.create({
    data: {
      poolId: admin.membership.poolId,
      actorId: admin.user.id,
      action: "simulate_scores",
      targetType: "week",
      targetId: week.id,
      details: JSON.stringify({
        games: updated.map((g) => g.id),
        gradedCount: graded.length,
      }),
    },
  });

  return NextResponse.json({ ok: true, simulated: updated.length, graded: graded.length });
}

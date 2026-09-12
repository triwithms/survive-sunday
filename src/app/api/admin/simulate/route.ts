import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { gradeWeekPicks, ensureWeekLockedEffects } from "@/lib/grading";

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
    include: { games: true },
  });
  if (!week) return NextResponse.json({ error: "Week not found" }, { status: 404 });

  const targets = gameId
    ? week.games.filter((g) => g.id === gameId)
    : week.games.filter((g) => g.status !== "final");

  const updated = [];
  for (const g of targets) {
    // Favour home slightly; random-ish but deterministic from game id
    const seed = g.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const homeScore = 17 + (seed % 14);
    const awayScore = 14 + ((seed * 3) % 17);
    const row = await prisma.game.update({
      where: { id: g.id },
      data: {
        status: "final",
        scoreHome: homeScore,
        scoreAway: awayScore,
      },
    });
    updated.push(row);
  }

  await ensureWeekLockedEffects(week.id);
  const graded = await gradeWeekPicks(week.id);

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

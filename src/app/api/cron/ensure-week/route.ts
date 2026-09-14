import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cronAuthorized } from "@/lib/cron-auth";
import { ensureWeekLockedEffects } from "@/lib/grading";
import { applyMirrorPicksForActiveWeeks } from "@/lib/pick-mirror-db";
import { syncWeekScoresFromEspn } from "@/lib/live-scores";
import { effectiveCurrentWeek } from "@/lib/pool-mode";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

export async function GET(req: Request) {
  if (!cronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mirrored = await applyMirrorPicksForActiveWeeks();

  const pools = await prisma.pool.findMany({
    select: { id: true, mode: true, currentWeek: true },
  });
  const lockEffects: Array<{ weekId: string; missed: number; graded: number }> =
    [];
  const scores: Array<{ weekId: string; updated?: number; error?: string }> = [];

  for (const pool of pools) {
    const number = effectiveCurrentWeek(pool.mode, pool.currentWeek);
    const week = await prisma.week.findUnique({
      where: { poolId_number: { poolId: pool.id, number } },
      select: { id: true },
    });
    if (!week) continue;
    const effects = await ensureWeekLockedEffects(week.id);
    lockEffects.push({
      weekId: week.id,
      missed: effects.missed.length,
      graded: effects.graded.length,
    });
    try {
      const sync = await syncWeekScoresFromEspn(week.id);
      scores.push({ weekId: week.id, updated: sync.updated });
    } catch (error) {
      scores.push({
        weekId: week.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return NextResponse.json({
    ok: true,
    mirrored,
    lockEffects,
    scores,
  });
}

export async function POST(req: Request) {
  return GET(req);
}

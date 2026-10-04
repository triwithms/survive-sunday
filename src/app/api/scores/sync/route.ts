import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMembershipForUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { syncPoolWeekFromEspn } from "@/lib/live-scores";
import { applyMirrorPicksForWeek } from "@/lib/pick-mirror-db";
import { effectiveCurrentWeek } from "@/lib/pool-mode";
import { MANUAL_SCORE_REFRESH_MS } from "@/lib/live-refresh-gate";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const me = await getMembershipForUser(session.user.id);
  if (!me) {
    return NextResponse.json({ error: "No membership" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const manual = body.manual === true;
  const raw = body.week;
  const parsed = Number(raw);
  const weekNumber =
    Number.isInteger(parsed) && parsed > 0
      ? parsed
      : effectiveCurrentWeek(me.pool.mode, me.pool.currentWeek);
  const week = await prisma.week.findUnique({
    where: {
      poolId_number: { poolId: me.poolId, number: weekNumber },
    },
  });
  if (!week) {
    return NextResponse.json({ error: "Week not found" }, { status: 404 });
  }

  try {
    const mirrored = await applyMirrorPicksForWeek(week.id);
    // Grade and standings only when this pull flips a game to final.
    // Score ticks still return `updated` so the client can refresh.
    const result = await syncPoolWeekFromEspn(week.id, {
      grade: false,
      standings: false,
      ...(manual ? { maxAgeMs: MANUAL_SCORE_REFRESH_MS } : {}),
    });
    const changed = result.updated > 0 || mirrored.copied.length > 0;
    return NextResponse.json({
      ok: true,
      weekNumber,
      mirrored: mirrored.copied.length,
      ...result,
      changed,
    });
  } catch (e) {
    console.error("scores sync failed", e);
    return NextResponse.json(
      { error: "ESPN sync failed", detail: String(e) },
      { status: 502 }
    );
  }
}

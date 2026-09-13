import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMembershipForUser, isSessionReady } from "@/lib/session";
import { prisma } from "@/lib/db";
import { syncWeekScoresFromEspn } from "@/lib/live-scores";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  const session = await auth();
  if (!isSessionReady(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const me = await getMembershipForUser(session.user.id);
  if (!me) {
    return NextResponse.json({ error: "No membership" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const raw = body.week;
  const parsed = Number(raw);
  const weekNumber =
    Number.isInteger(parsed) && parsed > 0 ? parsed : me.pool.currentWeek;

  const week = await prisma.week.findUnique({
    where: {
      poolId_number: { poolId: me.poolId, number: weekNumber },
    },
  });
  if (!week) {
    return NextResponse.json({ error: "Week not found" }, { status: 404 });
  }

  try {
    const result = await syncWeekScoresFromEspn(week.id);
    return NextResponse.json({ ok: true, weekNumber, ...result });
  } catch (e) {
    console.error("scores sync failed", e);
    return NextResponse.json(
      { error: "ESPN sync failed", detail: String(e) },
      { status: 502 }
    );
  }
}

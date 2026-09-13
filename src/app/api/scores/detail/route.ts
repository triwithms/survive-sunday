import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMembershipForUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { fetchEspnGameDetail } from "@/lib/espn-game-detail";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const me = await getMembershipForUser(session.user.id);
  if (!me) {
    return NextResponse.json({ error: "No membership" }, { status: 403 });
  }

  const url = new URL(req.url);
  const gameId = url.searchParams.get("gameId")?.trim();
  if (!gameId) {
    return NextResponse.json({ error: "Missing gameId" }, { status: 400 });
  }

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: { week: { include: { pool: true } } },
  });
  if (!game || game.week.poolId !== me.poolId) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const seasonYear = Number(String(game.week.pool.season).slice(0, 4)) || 2026;
  try {
    const detail = await fetchEspnGameDetail({
      weekNumber: game.week.number,
      seasonYear,
      awayAbbr: game.awayAbbr,
      homeAbbr: game.homeAbbr,
    });
    if (!detail) {
      return NextResponse.json({
        ok: true,
        awayAbbr: game.awayAbbr,
        homeAbbr: game.homeAbbr,
        scoreAway: game.scoreAway,
        scoreHome: game.scoreHome,
        status: game.status,
        note: game.note,
        timeoutsAway: null,
        timeoutsHome: null,
        scoringPlays: [],
        currentDrive: null,
        recentDrives: [],
        leaders: [],
      });
    }
    return NextResponse.json({ ok: true, ...detail });
  } catch (e) {
    console.error("scores detail failed", e);
    return NextResponse.json(
      { error: "ESPN detail failed", detail: String(e) },
      { status: 502 }
    );
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMembershipForUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { loadGameVideos } from "@/lib/youtube-videos";
import { youtubeSearchUrl } from "@/lib/youtube-parse";

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
    include: { week: true },
  });
  if (!game || game.week.poolId !== me.poolId) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  try {
    const data = await loadGameVideos({
      week: game.week.number,
      awayAbbr: game.awayAbbr,
      homeAbbr: game.homeAbbr,
      status: game.status,
      kickoff: game.kickoff,
    });
    return NextResponse.json(data);
  } catch (e) {
    console.error("videos game failed", e);
    return NextResponse.json({
      ok: true,
      videos: [],
      unavailable: true,
      phase: game.status === "scheduled" ? "preview" : "highlight",
      searchUrl: youtubeSearchUrl(
        `${game.awayAbbr} vs ${game.homeAbbr} Week ${game.week.number} ${
          game.status === "scheduled" ? "Preview" : "Highlights"
        }`
      ),
    });
  }
}

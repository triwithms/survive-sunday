import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMembershipForUser } from "@/lib/session";
import { loadWeeklyVideos } from "@/lib/youtube-videos";

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
  const raw = Number(url.searchParams.get("week"));
  const week = Number.isInteger(raw) && raw > 0 ? raw : me.pool.currentWeek;

  try {
    const data = await loadWeeklyVideos(week);
    return NextResponse.json(data);
  } catch (e) {
    console.error("videos week failed", e);
    return NextResponse.json({
      ok: true,
      week,
      groups: { short: [], medium: [], long: [] },
      unavailable: true,
      nflChannelUrl: "https://www.youtube.com/@NFL",
    });
  }
}

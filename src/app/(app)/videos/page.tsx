import { auth } from "@/lib/auth";
import { getMembershipForUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { WeekSwitcher } from "@/components/WeekSwitcher";
import { WeeklyVideosPanel } from "@/components/WeeklyVideosPanel";
import {
  effectiveCurrentWeek,
  weeksForParticipants,
} from "@/lib/pool-mode";
import { parseWeekParam, resolveSelectedWeekNumber } from "@/lib/weeks";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = {
  week?: string | string[];
};

export default async function VideosPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const me = await getMembershipForUser(session.user.id);
  if (!me) redirect("/join");

  const params = await searchParams;
  const currentWeek = effectiveCurrentWeek(me.pool.mode, me.pool.currentWeek);
  const weeks = weeksForParticipants(
    me.pool.mode,
    await prisma.week.findMany({
      where: { poolId: me.poolId },
      orderBy: { number: "asc" },
      include: { games: { select: { id: true } } },
    })
  );
  const selectedNumber = resolveSelectedWeekNumber({
    requested: parseWeekParam(params?.week),
    weekNumbers: weeks.map((week) => week.number),
    currentWeek,
    allowFuture: true,
  });
  const selected =
    weeks.find((week) => week.number === selectedNumber) ??
    weeks.find((week) => week.number === currentWeek) ??
    weeks[0];

  if (!selected) {
    return (
      <div className="card-glass p-4 text-sm text-[var(--text-muted)]">
        No weeks have been seeded for this pool yet.
      </div>
    );
  }

  const weekOptions = weeks.map((candidate) => ({
    number: candidate.number,
    label: candidate.label,
    hasGames: candidate.games.length > 0,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl tracking-wide text-gold-400">
          Videos
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Official NFL (and a few reputable) YouTube videos for {selected.label}
          — <strong>2026/27 season only</strong>, not old archives. NFL official
          clips open on YouTube (they block in-app playback). ESPN, TSN, and
          some team clips can play here when YouTube allows it. After watching,
          switch back to Survive Sunday — we don’t jump you back automatically.
        </p>
      </div>
      <WeekSwitcher
        weeks={weekOptions}
        selectedWeek={selected.number}
        currentWeek={currentWeek}
        basePath="/videos"
        allowFuture
      />
      <WeeklyVideosPanel week={selected.number} />
    </div>
  );
}

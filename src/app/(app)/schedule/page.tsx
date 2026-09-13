import { auth } from "@/lib/auth";
import { getMembershipForUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { effectiveLockAt, isWeekLocked } from "@/lib/grading";
import { formatKickoff } from "@/lib/utils";
import { resolveFavourite } from "@/lib/matchup-meta";
import { WeekSwitcher } from "@/components/WeekSwitcher";
import { LiveScoresRefresh } from "@/components/LiveScoresRefresh";
import { InjuryChip } from "@/components/InjuryChip";
import {
  effectiveCurrentWeek,
  isSandboxWeekHidden,
  weeksForParticipants,
} from "@/lib/pool-mode";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  syncWeekScoresFromEspn,
  shouldPollLiveScores,
} from "@/lib/live-scores";
import { getInjuryCountsByTeam } from "@/lib/live-injuries";
import { formatInjuryChip, formatScoreLine } from "@/lib/game-display";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ScheduleSearchParams = {
  week?: string | string[];
};

export default async function SchedulePage({
  searchParams,
}: {
  searchParams?: Promise<ScheduleSearchParams>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const me = await getMembershipForUser(session.user.id);
  if (!me) redirect("/join");

  const params = await searchParams;
  const rawWeek = params?.week;
  const requestedWeek = Array.isArray(rawWeek) ? rawWeek[0] : rawWeek;
  const parsedWeek = requestedWeek ? Number(requestedWeek) : NaN;
  const currentWeek = effectiveCurrentWeek(me.pool.mode, me.pool.currentWeek);

  const weeks = weeksForParticipants(
    me.pool.mode,
    await prisma.week.findMany({
      where: { poolId: me.poolId },
      orderBy: { number: "asc" },
      include: {
        games: { orderBy: { kickoff: "asc" } },
      },
    })
  );

  const requestedIsValid =
    Number.isInteger(parsedWeek) &&
    !isSandboxWeekHidden(me.pool.mode, parsedWeek) &&
    weeks.some((candidate) => candidate.number === parsedWeek);
  const selectedNumber = requestedIsValid ? parsedWeek : currentWeek;
  const week =
    weeks.find((candidate) => candidate.number === selectedNumber) ??
    weeks.find((candidate) => candidate.number === currentWeek) ??
    weeks[0];

  if (!week) {
    return (
      <div className="card-glass p-4 text-sm text-[var(--text-muted)]">
        No weeks have been seeded for this pool yet.
      </div>
    );
  }

  const [, injuryFeed] = await Promise.all([
    syncWeekScoresFromEspn(week.id).catch((e) => {
      console.error("schedule espn score sync skipped", e);
      return null;
    }),
    getInjuryCountsByTeam(),
  ]);

  const weekFresh = await prisma.week.findUniqueOrThrow({
    where: { id: week.id },
    include: { games: { orderBy: { kickoff: "asc" } } },
  });
  const games = weekFresh.games;
  const poll = shouldPollLiveScores(games);

  const weekOptions = weeks.map((candidate) => ({
    number: candidate.number,
    label: candidate.label,
    hasGames: candidate.games.length > 0,
  }));
  const isCurrent = week.number === currentWeek;

  return (
    <div className="space-y-6 min-w-0">
      <div>
        <h1 className="font-display text-2xl text-gold-400 tracking-wide">
          Schedule
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Plan strong picks — tap a team for research. Live and final scores
          refresh from ESPN while games are on.
        </p>
      </div>

      <WeekSwitcher
        weeks={weekOptions}
        selectedWeek={week.number}
        currentWeek={currentWeek}
        basePath="/schedule"
        allowFuture
      />

      <LiveScoresRefresh weekNumber={week.number} poll={poll} />

      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline gap-2">
          <h2 className="font-display text-xl text-gold-400 tracking-wide">
            {week.label}
          </h2>
          {isCurrent ? (
            <span className="chip chip-gold text-[10px]">This week</span>
          ) : week.number < currentWeek ? (
            <span className="chip chip-one-loss text-[10px]">Past</span>
          ) : (
            <span className="chip chip-one-loss text-[10px]">Upcoming</span>
          )}
          <span className="text-xs text-[var(--text-muted)]">
            Lock: {formatKickoff(effectiveLockAt(week))}
            {isWeekLocked(week) ? " · Locked" : " · Open"}
          </span>
        </div>

        {games.length === 0 ? (
          <div className="card-glass p-4 text-sm text-[var(--text-muted)]">
            Games coming — not seeded yet.
          </div>
        ) : (
          <ul className="space-y-2">
            {games.map((g) => {
              const fav = resolveFavourite({
                homeAbbr: g.homeAbbr,
                awayAbbr: g.awayAbbr,
                spreadHome: g.spreadHome,
                spreadAway: g.spreadAway,
              });
              const awayInj = injuryFeed.byTeam.get(g.awayAbbr);
              const homeInj = injuryFeed.byTeam.get(g.homeAbbr);
              const awayChip = awayInj ? formatInjuryChip(awayInj) : null;
              const homeChip = homeInj ? formatInjuryChip(homeInj) : null;
              const scoreLine = formatScoreLine(g);
              return (
                <li key={g.id} className="card-glass p-3 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                    <Link
                      href={`/team/${g.awayAbbr}`}
                      prefetch={false}
                      className="inline-flex items-center min-h-11 px-1 font-semibold text-gold-400 hover:underline underline-offset-2"
                    >
                      {g.awayAbbr}
                    </Link>
                    <span className="text-[var(--text-muted)]">@</span>
                    <Link
                      href={`/team/${g.homeAbbr}`}
                      prefetch={false}
                      className="inline-flex items-center min-h-11 px-1 font-semibold text-gold-400 hover:underline underline-offset-2"
                    >
                      {g.homeAbbr}
                    </Link>
                    {g.status === "live" && (
                      <span className="chip chip-live text-[10px]">LIVE</span>
                    )}
                    {g.network && (
                      <span className="chip chip-one-loss text-[10px]">
                        {g.network}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-[var(--text-muted)] flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span>{scoreLine || formatKickoff(g.kickoff)}</span>
                    {fav && (
                      <span className="font-mono text-[var(--text-primary)]">
                        {fav.label}
                      </span>
                    )}
                  </div>
                  {(awayChip || homeChip) && (
                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[var(--text-muted)]">
                      {awayChip && awayInj && (
                        <Link
                          href={`/team/${g.awayAbbr}`}
                          prefetch={false}
                          className="inline-flex items-center gap-1"
                        >
                          <span className="font-mono">{g.awayAbbr}</span>
                          <InjuryChip counts={awayInj} />
                        </Link>
                      )}
                      {homeChip && homeInj && (
                        <Link
                          href={`/team/${g.homeAbbr}`}
                          prefetch={false}
                          className="inline-flex items-center gap-1"
                        >
                          <span className="font-mono">{g.homeAbbr}</span>
                          <InjuryChip counts={homeInj} />
                        </Link>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

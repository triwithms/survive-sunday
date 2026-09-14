import { auth } from "@/lib/auth";
import { getMembershipForUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { ensureWeekLockedEffects, isWeekLocked } from "@/lib/grading";
import {
  syncWeekScoresFromEspn,
  shouldPollLiveScores,
} from "@/lib/live-scores";
import { WeekSwitcher } from "@/components/WeekSwitcher";
import { ScoreGameCard } from "@/components/ScoreGameCard";
import {
  effectiveCurrentWeek,
  weeksForParticipants,
} from "@/lib/pool-mode";
import { LiveScoresRefresh } from "@/components/LiveScoresRefresh";
import { AutoPickStamps } from "@/components/AutoPickStamps";
import Link from "next/link";
import { redirect } from "next/navigation";
import { parseWeekParam, resolvePageWeekNumber } from "@/lib/weeks";
import { teamLogoUrl } from "@/lib/espn-teams";
import { TeamLogo, TEAM_LOGO_SIZE } from "@/components/TeamLogo";
import { ShareExport } from "@/components/ShareExport";
import { boardPickFields, sortParticipants } from "@/lib/tiebreak";
import { isPoolParticipant } from "@/lib/pool-rules";
import { resolvePlayerPickWeekFromLoaded } from "@/lib/next-week-picks";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ScoresSearchParams = {
  week?: string | string[];
};

function statusRank(status: string) {
  if (status === "live") return 0;
  if (status === "scheduled") return 1;
  return 2;
}

export default async function ScoresPage({
  searchParams,
}: {
  searchParams?: Promise<ScoresSearchParams>;
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
      include: {
        games: {
          select: {
            id: true,
            status: true,
            kickoff: true,
            awayAbbr: true,
            homeAbbr: true,
          },
        },
      },
    })
  );
  const currentWeekRow = weeks.find((row) => row.number === currentWeek);
  const myCurrentWeekPick = currentWeekRow
    ? await prisma.pick.findUnique({
        where: {
          membershipId_weekId: {
            membershipId: me.id,
            weekId: currentWeekRow.id,
          },
        },
      })
    : null;
  const decision = resolvePlayerPickWeekFromLoaded({
    poolCurrentWeek: currentWeek,
    weeks: weeks.map((row) => ({
      number: row.number,
      locked: isWeekLocked(row),
      games: row.games,
    })),
    currentPick: myCurrentWeekPick,
    playingFromWeek: me.playingFromWeek,
  });
  const focusWeek = decision.actionWeek;
  const selectedNumber = resolvePageWeekNumber({
    requested: parseWeekParam(params?.week),
    weekNumbers: weeks.map((week) => week.number),
    basePath: "/scores",
    poolCurrentWeek: currentWeek,
    pickActionWeek: focusWeek,
    allowFuture: true,
  });
  const selectedRef =
    weeks.find((week) => week.number === selectedNumber) ??
    weeks.find((week) => week.number === focusWeek) ??
    weeks[0];

  if (!selectedRef) {
    return (
      <div className="card-glass p-4 text-sm text-[var(--text-muted)]">
        No weeks have been seeded for this pool yet.
      </div>
    );
  }

  try {
    await ensureWeekLockedEffects(selectedRef.id);
  } catch (e) {
    console.error("scores lock effects skipped", e);
  }

  let espnSyncError: string | null = null;
  try {
    await syncWeekScoresFromEspn(selectedRef.id);
  } catch (e) {
    console.error("espn score sync skipped", e);
    espnSyncError = "Couldn’t refresh ESPN right now — showing last saved scores.";
  }

  const week = await prisma.week.findUniqueOrThrow({
    where: { id: selectedRef.id },
    include: { games: { orderBy: { kickoff: "asc" } } },
  });
  const teamAbbrs = [
    ...new Set(week.games.flatMap((g) => [g.awayAbbr, g.homeAbbr])),
  ];
  const logoRows = teamAbbrs.length
    ? await prisma.team.findMany({
        where: { abbr: { in: teamAbbrs } },
        select: { abbr: true, logoUrl: true },
      })
    : [];
  const logoByAbbr = new Map(logoRows.map((t) => [t.abbr, t.logoUrl]));
  const locked = isWeekLocked(week);
  const revealAllPicks = locked || week.number < currentWeek;
  const members = await prisma.membership.findMany({
    where: { poolId: me.poolId },
    include: {
      picks: { where: { weekId: week.id } },
    },
  });
  const participants = sortParticipants(
    members
      .filter((member) => isPoolParticipant(member))
      .map((member) => ({
        ...member,
        ...boardPickFields(member.picks[0], week.games),
      }))
  );

  const weekOptions = weeks.map((candidate) => ({
    number: candidate.number,
    label: candidate.label,
    hasGames: candidate.games.length > 0,
  }));

  const games = [...week.games].sort((a, b) => {
    const rank = statusRank(a.status) - statusRank(b.status);
    if (rank !== 0) return rank;
    return a.kickoff.getTime() - b.kickoff.getTime();
  });
  const liveCount = games.filter((g) => g.status === "live").length;
  const poll = shouldPollLiveScores(games);

  return (
    <div
      id="share-scores"
      data-share-root="scores"
      data-share-week={week.label}
      className="space-y-4 min-w-0"
    >
        <div
          className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
          data-share-chunk=""
          data-share-section="heading"
        >
          <div className="min-w-0">
            <ShareExport
              surface="scores"
              rootId="share-scores"
              weekLabel={week.label}
              titleRest=" scores"
              gameCount={games.length}
              liveGameCount={liveCount}
              pickRowCount={participants.length}
            />
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Live scores from ESPN. Team logos sit beside the abbreviations.
              Logos open team pages. Finals auto-grade picks.
            </p>
            <p
              className="text-sm text-[var(--text-muted)] mt-1"
              data-share-chrome=""
            >
              Tap Details on a game — live or Final — for more, including
              YouTube highlights when NFL has posted them.
            </p>
            {liveCount > 0 ? (
              <p className="text-sm text-[var(--text-muted)] mt-1">
                {liveCount} live now
              </p>
            ) : null}
            {espnSyncError && (
              <p className="text-xs text-crimson-400 mt-1">{espnSyncError}</p>
            )}
          </div>
        </div>

      <div data-share-chrome="">
        <WeekSwitcher
          weeks={weekOptions}
          selectedWeek={week.number}
          currentWeek={focusWeek}
          basePath="/scores"
          allowFuture
        />
        <LiveScoresRefresh weekNumber={week.number} poll={poll} />
      </div>

      {games.length === 0 ? (
        <div
          className="card-glass p-4 text-sm text-[var(--text-muted)]"
          data-share-chunk=""
          data-share-section="games"
        >
          Games for {week.label} have not been seeded yet. Check back when the
          games are available.
        </div>
      ) : (
        <ul className="space-y-2" data-share-section="games">
          {games.map((g) => (
            <ScoreGameCard
              key={g.id}
              game={{
                id: g.id,
                awayAbbr: g.awayAbbr,
                homeAbbr: g.homeAbbr,
                scoreAway: g.scoreAway,
                scoreHome: g.scoreHome,
                status: g.status,
                note: g.note,
                kickoff: g.kickoff,
                network: g.network,
                awayLogoUrl: teamLogoUrl(g.awayAbbr, logoByAbbr.get(g.awayAbbr)),
                homeLogoUrl: teamLogoUrl(g.homeAbbr, logoByAbbr.get(g.homeAbbr)),
              }}
            />
          ))}
        </ul>
      )}

      <section className="space-y-3" data-share-section="picks">
        <div
          className="flex flex-wrap items-baseline gap-2"
          data-share-chunk=""
        >
          <h2 className="font-display text-xl text-gold-400 tracking-wide">
            Participants&apos; picks
          </h2>
          <span className="text-xs text-[var(--text-muted)]">
            {revealAllPicks ? "Picks revealed" : "Others reveal after kickoff"}
          </span>
        </div>
        <ul className="space-y-2">
          {participants.map((member) => {
            const rawPick = member.picks[0];
            const isSelf = member.id === me.id;
            const showPick = revealAllPicks || isSelf;
            const pick =
              rawPick &&
              rawPick.source !== "missed" &&
              rawPick.teamAbbr !== "MISS"
                ? rawPick
                : null;
            const result = rawPick?.result ?? "pending";
            return (
              <li
                key={member.id}
                className="card-glass p-3"
                data-share-chunk=""
                data-share-row=""
                data-status={member.status}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium min-w-0 truncate">
                    {member.nickname}
                    <AutoPickStamps count={member.autoPickStamps} />
                    {isSelf ? " (you)" : ""}
                    {member.realName ? (
                      <span className="text-xs font-normal text-[var(--text-muted)]">
                        {" "}
                        ({member.realName})
                      </span>
                    ) : null}
                  </span>
                  {showPick ? (
                    <span className="text-sm text-right shrink-0">
                      {pick ? (
                        <>
                          <Link
                            href={`/team/${pick.teamAbbr}`}
                            prefetch={false}
                            className="inline-flex items-center justify-end gap-1.5 font-mono text-gold-400 underline underline-offset-2 decoration-gold-400/40"
                          >
                            <TeamLogo
                              abbr={pick.teamAbbr}
                              logoUrl={teamLogoUrl(
                                pick.teamAbbr,
                                logoByAbbr.get(pick.teamAbbr)
                              )}
                              size={TEAM_LOGO_SIZE.compact}
                            />
                            {pick.teamAbbr}
                          </Link>{" "}
                          <span
                            className={
                              result === "win"
                                ? "text-field-400"
                                : result === "loss"
                                  ? "text-crimson-400"
                                  : "text-[var(--text-muted)]"
                            }
                          >
                            · {result}
                          </span>
                        </>
                      ) : (
                        <span className="text-[var(--text-muted)]">
                          No pick{rawPick?.result ? ` · ${result}` : ""}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-sm text-[var(--text-muted)] italic shrink-0">
                      Reveals after kickoff
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
      <p
        data-share-stamp=""
        className="text-[11px] text-[var(--text-muted)] pt-1"
      >
        Survive Sunday · {week.label} · for friends, not betting
      </p>
    </div>
  );
}

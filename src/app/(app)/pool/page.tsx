import { auth } from "@/lib/auth";
import { getMembershipForUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { boardPickFields, sortParticipants } from "@/lib/tiebreak";
import { effectiveLockAt, isWeekLocked, ensureWeekLockedEffects, MISSED_TEAM } from "@/lib/grading";
import { canEditExistingPick, gameForPick } from "@/lib/pick-change";
import {
  homeEmptyPickCopy,
  nextWeekOpenHeadline,
  pickHrefForWeek,
  resolvePlayerPickWeekFromLoaded,
} from "@/lib/next-week-picks";
import { StatusChip } from "@/components/StatusChip";
import { AutoPickStamps } from "@/components/AutoPickStamps";
import { formatKickoff } from "@/lib/utils";
import {
  formatCurrentStanding,
  formatPriorYearRank,
  resolveFavourite,
} from "@/lib/matchup-meta";
import Link from "next/link";
import { redirect } from "next/navigation";
import { WeekSwitcher } from "@/components/WeekSwitcher";
import { LiveScoresRefresh } from "@/components/LiveScoresRefresh";
import { InjuryChip } from "@/components/InjuryChip";
import {
  syncWeekScoresFromEspn,
  shouldPollLiveScores,
} from "@/lib/live-scores";
import { getTeamInjuries } from "@/lib/live-injuries";
import { formatInjuryChip, formatScoreLine } from "@/lib/game-display";
import {
  effectiveCurrentWeek,
  weeksForParticipants,
} from "@/lib/pool-mode";
import { parseWeekParam, resolveSelectedWeekNumber } from "@/lib/weeks";
import { isPoolParticipant } from "@/lib/pool-rules";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PoolSearchParams = {
  week?: string | string[];
};

export default async function PoolPage({
  searchParams,
}: {
  searchParams?: Promise<PoolSearchParams>;
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
  const selectedNumber = resolveSelectedWeekNumber({
    requested: parseWeekParam(params?.week),
    weekNumbers: weeks.map((candidate) => candidate.number),
    currentWeek,
  });
  const selectedRef =
    weeks.find((candidate) => candidate.number === selectedNumber) ??
    weeks.find((candidate) => candidate.number === currentWeek) ??
    weeks[0];

  if (!selectedRef) {
    return (
      <div className="card-glass p-4 text-sm text-[var(--text-muted)]">
        No weeks have been seeded for this pool yet.
      </div>
    );
  }

  await ensureWeekLockedEffects(selectedRef.id);
  try {
    await syncWeekScoresFromEspn(selectedRef.id);
  } catch (e) {
    console.error("pool espn score sync skipped", e);
  }

  const week = await prisma.week.findUniqueOrThrow({
    where: { id: selectedRef.id },
    include: { games: true, picks: true },
  });

  // Refresh own membership — missed-pick / grade may have updated status
  const meFresh = await getMembershipForUser(session.user.id);
  const self = meFresh ?? me;

  const locked = isWeekLocked(week);
  const isCurrentWeek = week.number === currentWeek;
  const revealAllPicks = locked || week.number < currentWeek;
  const weekOptions = weeks.map((candidate) => ({
    number: candidate.number,
    label: candidate.label,
    hasGames: candidate.games.length > 0,
  }));
  const members = await prisma.membership.findMany({
    where: { poolId: me.poolId },
    include: {
      picks: { where: { weekId: week.id }, include: { game: true } },
    },
  });

  const participants = members
    .filter((m) => isPoolParticipant(m))
    .map((m) => ({
      ...m,
      ...boardPickFields(m.picks[0], week.games),
    }));
  const sorted = sortParticipants(participants);
  const myPickRaw = members.find((m) => m.id === self.id)?.picks[0];
  const myPick =
    myPickRaw && myPickRaw.source !== "missed" && myPickRaw.teamAbbr !== MISSED_TEAM
      ? myPickRaw
      : undefined;
  const canChangePick =
    isCurrentWeek &&
    self.status !== "eliminated" &&
    self.role !== "admin" &&
    canEditExistingPick({
      weekNumber: week.number,
      weekLocked: locked,
      existingPick: myPickRaw ?? null,
      existingGame: gameForPick(myPickRaw, week.games) ?? myPick?.game ?? null,
    });
  const currentWeekRef = weeks.find((row) => row.number === currentWeek);
  const currentPickForDecision = isCurrentWeek
    ? myPickRaw ?? null
    : currentWeekRef
      ? await prisma.pick.findUnique({
          where: {
            membershipId_weekId: {
              membershipId: self.id,
              weekId: currentWeekRef.id,
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
    currentPick: currentPickForDecision,
    playingFromWeek: self.playingFromWeek,
  });
  const emptyPick = homeEmptyPickCopy(decision);
  const nextWeekRef = weeks.find((row) => row.number === decision.nextWeek);
  const nextWeekPick =
    nextWeekRef &&
    (decision.nextWeekOpen || decision.reason === "slate_not_ready")
      ? await prisma.pick.findUnique({
          where: {
            membershipId_weekId: {
              membershipId: self.id,
              weekId: nextWeekRef.id,
            },
          },
        })
      : null;
  const hasNextPick = Boolean(
    nextWeekPick &&
      nextWeekPick.source !== "missed" &&
      nextWeekPick.teamAbbr !== MISSED_TEAM
  );

  const myTeam = myPick
    ? await prisma.team.findUnique({ where: { abbr: myPick.teamAbbr } })
    : null;
  const myFav =
    myPick?.game
      ? resolveFavourite({
          homeAbbr: myPick.game.homeAbbr,
          awayAbbr: myPick.game.awayAbbr,
          spreadHome: myPick.game.spreadHome,
          spreadAway: myPick.game.spreadAway,
        })
      : null;
  const myInjuries = myPick
    ? await getTeamInjuries(myPick.teamAbbr)
    : null;
  const poll = shouldPollLiveScores(week.games);
  const myPrior = formatPriorYearRank(myTeam?.priorYearRank);
  const myStanding = myTeam
    ? formatCurrentStanding({
        wins: myTeam.wins,
        losses: myTeam.losses,
        ties: myTeam.ties,
        divisionRank: myTeam.divisionRank,
        conference: myTeam.conference,
        division: myTeam.division,
      })
    : null;

  const groups = [
    { key: "undefeated", label: "Undefeated" },
    { key: "one_loss", label: "One loss" },
    { key: "eliminated", label: "Eliminated" },
  ] as const;

  type Participant = (typeof participants)[number];
  const validPick = (m: Participant) => {
    const pickRaw = m.picks[0];
    return pickRaw &&
      pickRaw.source !== "missed" &&
      pickRaw.teamAbbr !== MISSED_TEAM
      ? pickRaw
      : undefined;
  };
  const gamesByKickoff = [...week.games].sort(
    (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime(),
  );
  // Same comparator as the Survival board (filter keeps that order).
  const missedOrNoPick = sorted.filter((m) => !validPick(m));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl tracking-wide text-gold-400">
          {week.label}
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Lock: {formatKickoff(effectiveLockAt(week))}
          {revealAllPicks ? " · Picks revealed" : " · Others' picks hidden"}
        </p>
      </div>

      <WeekSwitcher
        weeks={weekOptions}
        selectedWeek={week.number}
        currentWeek={currentWeek}
        basePath="/pool"
      />

      <LiveScoresRefresh weekNumber={week.number} poll={poll} />

      <section className="card-glass p-4">
        <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-2">
          Your pick
        </p>
        {myPick ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xl font-semibold text-gold-400">
                {myPick.teamAbbr}
              </p>
              {(myPrior || myStanding) && (
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {[myPrior, myStanding].filter(Boolean).join(" · ")}
                </p>
              )}
              {myPick.game && (
                <p className="text-sm text-[var(--text-muted)]">
                  {myPick.game.awayAbbr} @ {myPick.game.homeAbbr}
                  {formatScoreLine(myPick.game)
                    ? ` · ${formatScoreLine(myPick.game)}`
                    : ""}
                </p>
              )}
              {myInjuries && !myInjuries.failed && (
                <p className="mt-1">
                  <Link
                    href={`/team/${myPick.teamAbbr}`}
                    prefetch={false}
                    className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] underline underline-offset-2 decoration-gold-400/30 hover:text-gold-400"
                  >
                    {formatInjuryChip(myInjuries.counts) ? (
                      <InjuryChip counts={myInjuries.counts} />
                    ) : (
                      "Injury report"
                    )}
                  </Link>
                </p>
              )}
              {myFav && (
                <p className="text-xs font-mono text-[var(--text-muted)] mt-0.5">
                  {myFav.label}
                </p>
              )}
              {myPick.source === "imported" && (
                <span className="chip chip-live mt-1">Imported</span>
              )}
            </div>
            <div className="text-right">
              <StatusChip status={self.status} />
              {myPick.result && (
                <p
                  className={`text-sm mt-1 font-medium ${
                    myPick.result === "win"
                      ? "text-field-400"
                      : myPick.result === "loss"
                        ? "text-crimson-400"
                        : "text-[var(--text-muted)]"
                  }`}
                >
                  {myPick.result}
                </p>
              )}
            </div>
            {canChangePick && (
              <Link
                href={pickHrefForWeek(week.number)}
                prefetch={false}
                className="btn-primary text-center text-sm shrink-0 sm:ml-auto"
              >
                Change pick
              </Link>
            )}
            {!canChangePick &&
              isCurrentWeek &&
              (decision.nextWeekOpen || decision.reason === "slate_not_ready") && (
                <Link
                  href={pickHrefForWeek(decision.nextWeek)}
                  prefetch={false}
                  className="btn-primary text-center text-sm shrink-0 sm:ml-auto"
                >
                  {hasNextPick
                    ? `Change Week ${decision.nextWeek} pick`
                    : nextWeekOpenHeadline(
                        decision.nextWeek,
                        decision.slateReady
                      )}
                </Link>
              )}
          </div>
        ) : self.status === "eliminated" ? (
          <p className="text-[var(--text-muted)]">You&apos;re eliminated — still welcome to hang out.</p>
        ) : self.role === "admin" || !isPoolParticipant(self) ? (
          <div className="space-y-2">
            <p className="text-[var(--text-muted)]">
              Commissioner view — you&apos;re not required to pick.
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              Also a player?{" "}
              <Link href="/join" className="text-gold-400 underline-offset-2 hover:underline">
                Claim your name on Join
              </Link>{" "}
              with this same email so your picks stay with that seat.
            </p>
          </div>
        ) : locked || !isCurrentWeek ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p
              className={
                emptyPick.missed
                  ? "text-crimson-400"
                  : "text-[var(--text-muted)]"
              }
            >
              {emptyPick.message}
            </p>
            {emptyPick.href && emptyPick.ctaLabel && (
              <Link
                href={emptyPick.href}
                prefetch={false}
                className="btn-primary text-sm shrink-0"
              >
                {emptyPick.ctaLabel}
              </Link>
            )}
          </div>
        ) : isCurrentWeek ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-[var(--text-muted)]">
              Make your pick before kickoff—don&apos;t leave your mates hanging.
            </p>
            <Link href="/pick" prefetch={false} className="btn-primary text-sm shrink-0">
              Pick now
            </Link>
          </div>
        ) : (
          <p className="text-[var(--text-muted)]">No pick recorded for this week.</p>
        )}
      </section>

      {revealAllPicks ? (
        <section>
          <h2 className="text-lg font-semibold mb-3">Picks by game</h2>
          <div className="space-y-5">
            {gamesByKickoff.map((game) => {
              const isLive = game.status === "live";
              const isFinal = game.status === "final";
              const awayCluster = sorted.filter(
                (m) => validPick(m)?.teamAbbr === game.awayAbbr
              );
              const homeCluster = sorted.filter(
                (m) => validPick(m)?.teamAbbr === game.homeAbbr
              );
              return (
                <div key={game.id} className="card-glass p-4 space-y-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <p className="font-mono font-semibold text-gold-400">
                        {game.awayAbbr} @ {game.homeAbbr}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {isLive || isFinal
                          ? formatScoreLine(game) || formatKickoff(game.kickoff)
                          : formatKickoff(game.kickoff)}
                      </p>
                    </div>
                    {isLive && (
                      <span className="chip chip-live shrink-0">LIVE</span>
                    )}
                    {isFinal && (
                      <span className="chip chip-gold shrink-0">final</span>
                    )}
                  </div>
                  {(
                    [
                      { abbr: game.awayAbbr, rows: awayCluster },
                      { abbr: game.homeAbbr, rows: homeCluster },
                    ] as const
                  ).map((cluster) =>
                    cluster.rows.length ? (
                      <div key={cluster.abbr}>
                        <h3 className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2">
                          <Link
                            href={`/team/${cluster.abbr}`}
                            prefetch={false}
                            className="font-mono text-gold-400 underline underline-offset-2 decoration-gold-400/40 hover:decoration-gold-400"
                          >
                            {cluster.abbr}
                          </Link>
                        </h3>
                        <ul className="space-y-2">
                          {cluster.rows.map((m) => {
                            const pick = validPick(m);
                            if (!pick) return null;
                            const isSelf = m.id === self.id;
                            const faded =
                              m.status === "eliminated" ? "opacity-60" : "";
                            return (
                              <li
                                key={m.id}
                                className={`card-glass p-3 ${faded}`}
                              >
                                <div className="flex items-center gap-2 flex-wrap min-w-0">
                                  <span className="font-medium min-w-0">
                                    {m.nickname}
                                    <AutoPickStamps count={m.autoPickStamps} />
                                    {isSelf ? " (you)" : ""}
                                    {m.realName ? (
                                      <span className="text-xs font-normal text-[var(--text-muted)]">
                                        {" "}
                                        ({m.realName})
                                      </span>
                                    ) : null}
                                  </span>
                                  <StatusChip status={m.status} />
                                  {pick.result && (
                                    <span
                                      className={`text-sm font-medium ${
                                        pick.result === "win"
                                          ? "text-field-400"
                                          : pick.result === "loss"
                                            ? "text-crimson-400"
                                            : "text-[var(--text-muted)]"
                                      }`}
                                    >
                                      {pick.result}
                                    </span>
                                  )}
                                  {pick.source === "imported" && (
                                    <span className="text-xs text-[var(--text-muted)]">
                                      imported
                                    </span>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ) : null,
                  )}
                </div>
              );
            })}

            {missedOrNoPick.length > 0 && (
              <div>
                <h3 className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2">
                  Missed / no pick
                </h3>
                <ul className="space-y-2">
                  {missedOrNoPick.map((m) => {
                    const isSelf = m.id === self.id;
                    const faded =
                      m.status === "eliminated" ? "opacity-60" : "";
                    const pickRaw = m.picks[0];
                    const isMissed =
                      !!pickRaw &&
                      (pickRaw.source === "missed" ||
                        pickRaw.teamAbbr === MISSED_TEAM);
                    return (
                      <li
                        key={m.id}
                        className={`card-glass p-3 ${faded}`}
                      >
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <span className="font-medium min-w-0">
                            {m.nickname}
                            <AutoPickStamps count={m.autoPickStamps} />
                            {isSelf ? " (you)" : ""}
                            {m.realName ? (
                              <span className="text-xs font-normal text-[var(--text-muted)]">
                                {" "}
                                ({m.realName})
                              </span>
                            ) : null}
                          </span>
                          <StatusChip status={m.status} />
                          <span className="text-sm text-[var(--text-muted)]">
                            {isMissed ? "Missed pick" : "No pick"}
                          </span>
                          {isMissed && pickRaw?.result && (
                            <span
                              className={`text-sm font-medium ${
                                pickRaw.result === "win"
                                  ? "text-field-400"
                                  : pickRaw.result === "loss"
                                    ? "text-crimson-400"
                                    : "text-[var(--text-muted)]"
                              }`}
                            >
                              {pickRaw.result}
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </section>
      ) : (
        <section>
          <h2 className="text-lg font-semibold mb-3">Participants</h2>
          <div className="space-y-5">
            {groups.map((g) => {
              const rows = sorted.filter((m) => m.status === g.key);
              if (!rows.length) return null;
              return (
                <div key={g.key}>
                  <h3 className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2">
                    {g.label}
                  </h3>
                  <ul className="space-y-2">
                    {rows.map((m) => {
                      const pickRaw = m.picks[0];
                      const pick =
                        pickRaw &&
                        pickRaw.source !== "missed" &&
                        pickRaw.teamAbbr !== MISSED_TEAM
                          ? pickRaw
                          : undefined;
                      const isSelf = m.id === self.id;
                      const show = isSelf;
                      const faded = m.status === "eliminated" ? "opacity-60" : "";
                      return (
                        <li
                          key={m.id}
                          className={`card-glass p-3 ${faded}`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium min-w-0">
                                {m.nickname}
                                <AutoPickStamps count={m.autoPickStamps} />
                                {isSelf ? " (you)" : ""}
                                {m.realName ? (
                                  <span className="text-xs font-normal text-[var(--text-muted)]">
                                    {" "}
                                    ({m.realName})
                                  </span>
                                ) : null}
                              </span>
                              <StatusChip status={m.status} />
                            </div>
                            {show && pick ? (
                              <div className="mt-1 text-sm">
                                <Link
                                  href={`/team/${pick.teamAbbr}`}
                                  prefetch={false}
                                  className="font-mono text-gold-400 underline underline-offset-2 decoration-gold-400/40 hover:decoration-gold-400"
                                >
                                  {pick.teamAbbr}
                                </Link>
                                {pick.game && (
                                  <span className="text-[var(--text-muted)]">
                                    {" "}
                                    · {pick.game.awayAbbr} @ {pick.game.homeAbbr}
                                  </span>
                                )}
                                {pick.result && (
                                  <span
                                    className={
                                      pick.result === "win"
                                        ? " text-field-400"
                                        : pick.result === "loss"
                                          ? " text-crimson-400"
                                          : " text-[var(--text-muted)]"
                                    }
                                  >
                                    {" "}
                                    · {pick.result}
                                  </span>
                                )}
                                {pick.source === "imported" && (
                                  <span className="text-[var(--text-muted)]">
                                    {" "}
                                    · imported
                                  </span>
                                )}
                              </div>
                            ) : show ? (
                              <p className="text-sm text-[var(--text-muted)] mt-1">
                                No pick
                              </p>
                            ) : (
                              <p className="text-sm text-[var(--text-muted)] mt-1 italic">
                                Reveals after kickoff
                              </p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

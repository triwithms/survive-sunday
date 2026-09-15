import { auth } from "@/lib/auth";
import { getMembershipForUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { isWeekLocked, ensureWeekLockedEffects, parseUsedTeams, MISSED_TEAM } from "@/lib/grading";
import { canEditExistingPick, gameForPick } from "@/lib/pick-change";
import {
  isPlayerPickWeek,
  resolvePlayerPickWeekFromLoaded,
} from "@/lib/next-week-picks";
import { redirect } from "next/navigation";
import { PickClient } from "@/components/PickClient";
import { LiveScoresRefresh } from "@/components/LiveScoresRefresh";
import {
  syncWeekScoresFromEspn,
  shouldPollLiveScores,
} from "@/lib/live-scores";
import { getInjuryCountsByTeam } from "@/lib/live-injuries";
import { effectiveCurrentWeek, weeksForParticipants } from "@/lib/pool-mode";
import { parseWeekParam, resolvePageWeekNumber } from "@/lib/weeks";
import { teamLogoUrl } from "@/lib/espn-teams";
import { isPoolParticipant } from "@/lib/pool-rules";
import { sanitizeGameOdds } from "@/lib/odds";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PickSearchParams = {
  week?: string | string[];
};

export default async function PickPage({
  searchParams,
}: {
  searchParams?: Promise<PickSearchParams>;
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
  const selectedNumber = resolvePageWeekNumber({
    requested: parseWeekParam(params?.week),
    weekNumbers: weeks.map((row) => row.number),
    basePath: "/pick",
    poolCurrentWeek: currentWeek,
    pickActionWeek: decision.actionWeek,
    allowFuture: true,
  });
  const weekRef =
    weeks.find((row) => row.number === selectedNumber) ??
    weeks.find((row) => row.number === decision.actionWeek);
  if (!weekRef) {
    return (
      <div className="card-glass p-4 text-sm text-[var(--text-muted)]">
        No weeks have been seeded for this pool yet.
      </div>
    );
  }
  try {
    await ensureWeekLockedEffects(weekRef.id);
  } catch (e) {
    console.error("pick lock effects skipped", e);
  }
  const [, injuryFeed] = await Promise.all([
    syncWeekScoresFromEspn(weekRef.id).catch((e) => {
      console.error("pick espn score sync skipped", e);
      return null;
    }),
    getInjuryCountsByTeam(),
  ]);

  const week = await prisma.week.findUniqueOrThrow({
    where: { id: weekRef.id },
    include: { games: { orderBy: { kickoff: "asc" } } },
  });

  const locked = isWeekLocked(week);
  const eliminated = me.status === "eliminated";
  const spectator = !isPoolParticipant(me);

  const myPick = await prisma.pick.findUnique({
    where: {
      membershipId_weekId: { membershipId: me.id, weekId: week.id },
    },
  });
  const currentAbbr =
    myPick && myPick.source !== "missed" && myPick.teamAbbr !== MISSED_TEAM
      ? myPick.teamAbbr
      : null;
  const canChange =
    !eliminated &&
    !spectator &&
    isPlayerPickWeek(decision, week.number) &&
    canEditExistingPick({
      weekNumber: week.number,
      weekLocked: locked,
      existingPick: myPick,
      existingGame: gameForPick(myPick, week.games),
    });

  const priorAbbrs = (
    await prisma.pick.findMany({
      where: {
        membershipId: me.id,
        weekId: { not: week.id },
        source: { not: "missed" },
      },
    })
  ).map((p) => p.teamAbbr);
  const seededUsed = parseUsedTeams(me.usedTeamsJson).filter(
    (t) => t !== currentAbbr && t !== MISSED_TEAM
  );
  // Prior weeks + seed history only — current pick is free to change before lock
  const used = Array.from(new Set([...priorAbbrs, ...seededUsed]));

  const teams = await prisma.team.findMany({ orderBy: { abbr: "asc" } });
  const teamByAbbr = new Map(teams.map((t) => [t.abbr, t]));
  const poll = shouldPollLiveScores(week.games);

  function sidePayload(abbr: string) {
    const t = teamByAbbr.get(abbr);
    return {
      abbr,
      name: t?.name ?? abbr,
      logoUrl: teamLogoUrl(abbr, t?.logoUrl),
      alreadyUsed: used.includes(abbr),
      priorYearRank: t?.priorYearRank ?? null,
      injuries: injuryFeed.byTeam.get(abbr) ?? {
        out: 0,
        doubtful: 0,
        questionable: 0,
      },
      standing: t
        ? {
            wins: t.wins,
            losses: t.losses,
            ties: t.ties,
            divisionRank: t.divisionRank,
            conference: t.conference,
            division: t.division,
          }
        : null,
    };
  }

  const games = week.games.map((g) => {
    const odds = sanitizeGameOdds(g);
    return {
      id: g.id,
      kickoff:
        g.kickoff instanceof Date && !Number.isNaN(g.kickoff.getTime())
          ? g.kickoff.toISOString()
          : "",
      network: g.network,
      status: g.status,
      scoreAway: g.scoreAway,
      scoreHome: g.scoreHome,
      note: g.note,
      spreadHome: odds.spreadHome,
      spreadAway: odds.spreadAway,
      mlHome: odds.mlHome,
      mlAway: odds.mlAway,
      away: sidePayload(g.awayAbbr),
      home: sidePayload(g.homeAbbr),
    };
  });

  return (
    <>
      <LiveScoresRefresh weekNumber={week.number} poll={poll} />
      <PickClient
        key={week.number}
        weekNumber={week.number}
        decision={decision}
        locked={locked}
        canChange={canChange}
        eliminated={eliminated}
        spectator={spectator}
        currentPick={currentAbbr}
        games={games}
      />
    </>
  );
}

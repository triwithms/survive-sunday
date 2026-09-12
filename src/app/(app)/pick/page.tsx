import { auth } from "@/lib/auth";
import { getMembershipForUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { isWeekLocked, ensureWeekLockedEffects, parseUsedTeams, MISSED_TEAM } from "@/lib/grading";
import { redirect } from "next/navigation";
import { PickClient } from "@/components/PickClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PickPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const me = await getMembershipForUser(session.user.id);
  if (!me) redirect("/join");

  const weekRef = await prisma.week.findUniqueOrThrow({
    where: {
      poolId_number: { poolId: me.poolId, number: me.pool.currentWeek },
    },
  });
  try {
    await ensureWeekLockedEffects(weekRef.id);
  } catch (e) {
    console.error("pick lock effects skipped", e);
  }

  const week = await prisma.week.findUniqueOrThrow({
    where: { id: weekRef.id },
    include: { games: { orderBy: { kickoff: "asc" } } },
  });

  const locked = isWeekLocked(week);
  const eliminated = me.status === "eliminated";

  const myPick = await prisma.pick.findUnique({
    where: {
      membershipId_weekId: { membershipId: me.id, weekId: week.id },
    },
  });
  const currentAbbr =
    myPick && myPick.source !== "missed" && myPick.teamAbbr !== MISSED_TEAM
      ? myPick.teamAbbr
      : null;

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

  function sidePayload(abbr: string) {
    const t = teamByAbbr.get(abbr);
    return {
      abbr,
      name: t?.name ?? abbr,
      logoUrl: t?.logoUrl ?? null,
      alreadyUsed: used.includes(abbr),
      priorYearRank: t?.priorYearRank ?? null,
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

  const games = week.games.map((g) => ({
    id: g.id,
    kickoff:
      g.kickoff instanceof Date && !Number.isNaN(g.kickoff.getTime())
        ? g.kickoff.toISOString()
        : "",
    network: g.network,
    spreadHome: g.spreadHome,
    spreadAway: g.spreadAway,
    mlHome: g.mlHome,
    mlAway: g.mlAway,
    away: sidePayload(g.awayAbbr),
    home: sidePayload(g.homeAbbr),
  }));

  return (
    <PickClient
      weekNumber={week.number}
      locked={locked}
      eliminated={eliminated}
      currentPick={currentAbbr}
      games={games}
    />
  );
}

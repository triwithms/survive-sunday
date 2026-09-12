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
  const playing = new Set(
    week.games.flatMap((g) => [g.awayAbbr, g.homeAbbr])
  );

  const eligible = teams.map((t) => {
    const game = week.games.find(
      (g) => g.awayAbbr === t.abbr || g.homeAbbr === t.abbr
    );
    const onBye = !playing.has(t.abbr);
    const alreadyUsed = used.includes(t.abbr);
    return {
      abbr: t.abbr,
      name: t.name,
      logoUrl: t.logoUrl ?? null,
      onBye,
      alreadyUsed,
      disabled: onBye || alreadyUsed || locked || me.status === "eliminated",
      game: game
        ? {
            id: game.id,
            awayAbbr: game.awayAbbr,
            homeAbbr: game.homeAbbr,
            kickoff: game.kickoff instanceof Date && !Number.isNaN(game.kickoff.getTime())
              ? game.kickoff.toISOString()
              : "",
            spreadHome: game.spreadHome,
            spreadAway: game.spreadAway,
            mlHome: game.mlHome,
            mlAway: game.mlAway,
            network: game.network,
          }
        : null,
    };
  });

  return (
    <PickClient
      weekNumber={week.number}
      locked={locked}
      eliminated={me.status === "eliminated"}
      currentPick={currentAbbr}
      teams={eligible}
    />
  );
}

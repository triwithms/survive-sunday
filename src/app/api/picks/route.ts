import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getMembershipForUser, isSessionReady } from "@/lib/session";
import {
  effectiveLockAt,
  isWeekLocked,
  ensureWeekLockedEffects,
  rebuildUsedTeams,
  parseUsedTeams,
  MISSED_TEAM,
} from "@/lib/grading";

export async function POST(req: Request) {
  const session = await auth();
  if (!isSessionReady(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const membership = await getMembershipForUser(session.user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not in a pool" }, { status: 403 });
  }
  if (membership.status === "eliminated") {
    return NextResponse.json({ error: "Eliminated — no picks" }, { status: 403 });
  }
  if (membership.role === "admin") {
    return NextResponse.json(
      { error: "Commissioner is not a participant — no pick required" },
      { status: 403 }
    );
  }

  const { weekNumber, teamAbbr } = await req.json();
  const week = await prisma.week.findUnique({
    where: {
      poolId_number: { poolId: membership.poolId, number: weekNumber },
    },
    include: { games: true },
  });
  if (!week) {
    return NextResponse.json({ error: "Week not found" }, { status: 404 });
  }

  // Natural lock may have passed — apply effects and reject
  await ensureWeekLockedEffects(week.id);
  const weekFresh = await prisma.week.findUniqueOrThrow({ where: { id: week.id } });
  if (isWeekLocked(weekFresh)) {
    return NextResponse.json(
      { error: "Week is locked — picks cannot change", locked: true },
      { status: 403 }
    );
  }

  const team = await prisma.team.findUnique({ where: { abbr: teamAbbr } });
  if (!team) {
    return NextResponse.json({ error: "Unknown team" }, { status: 400 });
  }

  const game = week.games.find(
    (g) => g.awayAbbr === teamAbbr || g.homeAbbr === teamAbbr
  );
  if (!game) {
    return NextResponse.json(
      { error: "That team is on bye or not playing this week" },
      { status: 400 }
    );
  }

  const existing = await prisma.pick.findUnique({
    where: {
      membershipId_weekId: {
        membershipId: membership.id,
        weekId: week.id,
      },
    },
  });

  const prior = await prisma.pick.findMany({
    where: {
      membershipId: membership.id,
      weekId: { not: week.id },
      source: { not: "missed" },
    },
  });
  const seededUsed = parseUsedTeams(membership.usedTeamsJson);
  // Free current week's existing pick from the used set for change-before-lock
  const usedSet = new Set([
    ...prior.map((p) => p.teamAbbr),
    ...seededUsed.filter((t) => t !== existing?.teamAbbr && t !== MISSED_TEAM),
  ]);
  if (usedSet.has(teamAbbr)) {
    return NextResponse.json(
      { error: "You've already used that team this season" },
      { status: 400 }
    );
  }

  const freedTeam =
    existing && existing.teamAbbr !== teamAbbr ? existing.teamAbbr : null;

  const pick = await prisma.pick.upsert({
    where: {
      membershipId_weekId: {
        membershipId: membership.id,
        weekId: week.id,
      },
    },
    create: {
      membershipId: membership.id,
      weekId: week.id,
      teamAbbr,
      gameId: game.id,
      source: "user",
      result: "pending",
    },
    update: {
      teamAbbr,
      gameId: game.id,
      source: "user",
      submittedAt: new Date(),
      result: "pending",
    },
  });

  await rebuildUsedTeams(membership.id, { freedTeam });

  return NextResponse.json({ ok: true, pick, locked: false });
}

export async function GET(req: Request) {
  const session = await auth();
  if (!isSessionReady(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const membership = await getMembershipForUser(session.user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not in a pool" }, { status: 403 });
  }

  const url = new URL(req.url);
  const weekNumber = Number(
    url.searchParams.get("week") || membership.pool.currentWeek
  );

  const week = await prisma.week.findUnique({
    where: {
      poolId_number: { poolId: membership.poolId, number: weekNumber },
    },
    include: { games: true },
  });
  if (!week) {
    return NextResponse.json({ error: "Week not found" }, { status: 404 });
  }

  await ensureWeekLockedEffects(week.id);
  const weekFresh = await prisma.week.findUniqueOrThrow({
    where: { id: week.id },
    include: { games: true },
  });

  const locked = isWeekLocked(weekFresh);
  const members = await prisma.membership.findMany({
    where: { poolId: membership.poolId },
    include: {
      picks: { where: { weekId: week.id }, include: { game: true } },
    },
  });

  const participants = members
    .filter((m) => m.role !== "admin")
    .map((m) => {
      const pick = m.picks[0] || null;
      const isSelf = m.id === membership.id;
      const showPick = locked || isSelf;
      const isMissed = pick?.source === "missed";
      return {
        id: m.id,
        nickname: m.nickname,
        realName: m.realName,
        status: m.status,
        mulliganRemaining: m.mulliganRemaining,
        role: m.role,
        isSelf,
        pick:
          showPick && pick && !isMissed
            ? {
                teamAbbr: pick.teamAbbr,
                result: pick.result,
                source: pick.source,
                game: pick.game
                  ? {
                      awayAbbr: pick.game.awayAbbr,
                      homeAbbr: pick.game.homeAbbr,
                      kickoff: pick.game.kickoff,
                      status: pick.game.status,
                      scoreAway: pick.game.scoreAway,
                      scoreHome: pick.game.scoreHome,
                    }
                  : null,
              }
            : showPick
              ? null
              : { hidden: true },
      };
    });

  return NextResponse.json({
    week: {
      number: weekFresh.number,
      label: weekFresh.label,
      lockAt: effectiveLockAt(weekFresh).toISOString(),
      locked,
      status: weekFresh.status,
    },
    games: weekFresh.games,
    participants,
    myMembershipId: membership.id,
  });
}

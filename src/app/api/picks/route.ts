import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getMembershipForUser } from "@/lib/session";
import { effectiveCurrentWeek } from "@/lib/pool-mode";
import {
  effectiveLockAt,
  isWeekLocked,
  ensureWeekLockedEffects,
} from "@/lib/grading";
import { boardPickFields, sortParticipants } from "@/lib/tiebreak";
import { isPoolParticipant } from "@/lib/pool-rules";
import { submitPick } from "@/app/actions/submit-pick";

export async function POST(req: Request) {
  const { weekNumber, teamAbbr } = await req.json();
  const result = await submitPick(Number(weekNumber), String(teamAbbr ?? ""));
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, locked: result.locked },
      { status: result.status }
    );
  }
  return NextResponse.json({ ok: true, pick: result.pick, locked: false });
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const membership = await getMembershipForUser(session.user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not in a pool" }, { status: 403 });
  }

  const url = new URL(req.url);
  const weekNumber = Number(
    url.searchParams.get("week") ||
      effectiveCurrentWeek(membership.pool.mode, membership.pool.currentWeek)
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

  const participants = sortParticipants(
    members
      .filter((m) => isPoolParticipant(m))
      .map((m) => ({
        ...m,
        ...boardPickFields(m.picks[0], weekFresh.games),
      }))
  ).map((m) => {
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

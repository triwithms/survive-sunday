import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, getMembershipForUser } from "@/lib/session";
import { INVITE_CODE } from "@/lib/constants";
import {
  ensureWeekLockedEffects,
  isWeekLocked,
  undoPickMembershipEffect,
  parseUsedTeams,
  rebuildUsedTeams,
  MISSED_TEAM,
} from "@/lib/grading";

/**
 * Demo/testing toggle: After deadline | Before deadline for the current week.
 * API mode keys stay after_lock / before_lock. Allowed for any SUNDAY26 member.
 *
 * after_lock  — set lockOverrideAt to past, apply lock effects, then replace
 *               MISS with source=demo Week picks (testing only — not real picks)
 * before_lock — clear override, reopen; delete source missed/demo picks and undo effects
 */

function slateTeamList(
  games: { id: string; awayAbbr: string; homeAbbr: string }[]
): { teams: string[]; teamToGame: Map<string, string> } {
  const teamToGame = new Map<string, string>();
  const teams: string[] = [];
  for (const g of games) {
    teams.push(g.awayAbbr, g.homeAbbr);
    teamToGame.set(g.awayAbbr, g.id);
    teamToGame.set(g.homeAbbr, g.id);
  }
  return { teams, teamToGame };
}

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Demo-only: ensure every non-admin member has a non-MISS Week pick.
 * Keeps existing user/imported/admin picks; replaces missed (and refreshes demo).
 */
async function assignDemoWeekPicks(weekId: string, poolId: string): Promise<number> {
  const week = await prisma.week.findUniqueOrThrow({
    where: { id: weekId },
    include: { games: true, picks: true },
  });
  const memberships = await prisma.membership.findMany({
    where: { poolId, role: "member" },
    include: { picks: true },
  });

  const { teams: slateTeams, teamToGame } = slateTeamList(week.games);
  const uniqueSlate = Array.from(new Set(slateTeams));
  shuffleInPlace(uniqueSlate);

  const globalTaken = new Set<string>();
  for (const pick of week.picks) {
    if (
      pick.source !== "missed" &&
      pick.source !== "demo" &&
      pick.teamAbbr !== MISSED_TEAM
    ) {
      globalTaken.add(pick.teamAbbr);
    }
  }

  let assigned = 0;

  // Stable order then shuffle for varied assignment across re-runs
  const ordered = shuffleInPlace([...memberships]);

  for (const m of ordered) {
    const existing = week.picks.find((p) => p.membershipId === m.id);

    // Keep real (non-demo) picks — e.g. Gams user TB
    if (
      existing &&
      existing.source !== "missed" &&
      existing.source !== "demo" &&
      existing.teamAbbr !== MISSED_TEAM
    ) {
      continue;
    }

    const used = new Set(parseUsedTeams(m.usedTeamsJson));
    for (const p of m.picks) {
      if (p.weekId === weekId) continue;
      if (p.source === "missed" || p.teamAbbr === MISSED_TEAM) continue;
      used.add(p.teamAbbr);
    }

    if (existing) {
      await undoPickMembershipEffect(m.id, existing.result);
      await prisma.pick.delete({ where: { id: existing.id } });
    }

    const available = uniqueSlate.filter((t) => !used.has(t));
    const team =
      available.find((t) => !globalTaken.has(t)) ??
      available[0] ??
      uniqueSlate.find((t) => !used.has(t)) ??
      uniqueSlate[0];

    if (!team) continue;

    globalTaken.add(team);

    await prisma.pick.create({
      data: {
        membershipId: m.id,
        weekId: week.id,
        teamAbbr: team,
        gameId: teamToGame.get(team) ?? null,
        source: "demo",
        result: "pending",
        submittedAt: new Date(),
        gradedAt: null,
      },
    });
    await rebuildUsedTeams(m.id);
    assigned += 1;
  }

  return assigned;
}

async function clearDemoAndMissedPicks(weekId: string): Promise<number> {
  const picks = await prisma.pick.findMany({
    where: { weekId, source: { in: ["missed", "demo"] } },
  });
  let cleared = 0;
  for (const pick of picks) {
    await undoPickMembershipEffect(pick.membershipId, pick.result);
    await prisma.pick.delete({ where: { id: pick.id } });
    await rebuildUsedTeams(pick.membershipId);
    cleared += 1;
  }
  return cleared;
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await getMembershipForUser(user.id);
  if (!membership) {
    return NextResponse.json({ error: "No pool membership" }, { status: 403 });
  }
  if (membership.pool.inviteCode !== INVITE_CODE) {
    return NextResponse.json(
      { error: "Demo lock mode is only available on the demo pool" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const mode = body.mode as string | undefined;
  if (mode !== "after_lock" && mode !== "before_lock") {
    return NextResponse.json(
      { error: "mode must be after_lock or before_lock" },
      { status: 400 }
    );
  }

  const week = await prisma.week.findUnique({
    where: {
      poolId_number: {
        poolId: membership.poolId,
        number: membership.pool.currentWeek,
      },
    },
  });
  if (!week) return NextResponse.json({ error: "Week not found" }, { status: 404 });

  let clearedMissed = 0;
  let missedApplied = 0;
  let demoPicksAssigned = 0;

  if (mode === "after_lock") {
    await prisma.week.update({
      where: { id: week.id },
      data: {
        lockOverrideAt: new Date(Date.now() - 1000),
        status: "locked",
      },
    });
    const effects = await ensureWeekLockedEffects(week.id);
    missedApplied = effects.missed.length;
    // Demo/testing only: fill the board — do not leave MISS as the story
    demoPicksAssigned = await assignDemoWeekPicks(week.id, membership.poolId);
  } else {
    // before_lock: clear override; remove missed + demo picks; keep real user picks
    clearedMissed = await clearDemoAndMissedPicks(week.id);
    await prisma.week.update({
      where: { id: week.id },
      data: {
        lockOverrideAt: null,
        status: "open",
        missedPicksAppliedAt: null,
      },
    });
  }

  const updated = await prisma.week.findUniqueOrThrow({ where: { id: week.id } });

  await prisma.auditLog.create({
    data: {
      poolId: membership.poolId,
      actorId: user.id,
      action: `demo_lock_mode_${mode}`,
      targetType: "week",
      targetId: week.id,
      details: JSON.stringify({
        weekNumber: week.number,
        lockAt: updated.lockAt,
        lockOverrideAt: updated.lockOverrideAt,
        missedApplied,
        clearedMissed,
        demoPicksAssigned,
        note: "Demo testing toggle — reversible; seeded lockAt preserved on before_lock; demo picks are not real BM Boys picks",
      }),
    },
  });

  return NextResponse.json({
    ok: true,
    mode,
    locked: isWeekLocked(updated),
    weekNumber: updated.number,
    lockAt: updated.lockAt,
    lockOverrideAt: updated.lockOverrideAt,
    missedApplied,
    clearedMissed,
    demoPicksAssigned,
  });
}

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await getMembershipForUser(user.id);
  if (!membership || membership.pool.inviteCode !== INVITE_CODE) {
    return NextResponse.json({ demo: false });
  }

  const week = await prisma.week.findUnique({
    where: {
      poolId_number: {
        poolId: membership.poolId,
        number: membership.pool.currentWeek,
      },
    },
  });
  if (!week) return NextResponse.json({ demo: true, locked: true });

  return NextResponse.json({
    demo: true,
    locked: isWeekLocked(week),
    weekNumber: week.number,
    lockAt: week.lockAt,
    lockOverrideAt: week.lockOverrideAt,
  });
}

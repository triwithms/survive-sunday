import "server-only";
import { prisma } from "./db";
import { ensureWeekLockedEffects, isWeekLocked } from "./grading";
import {
  evaluatePickChange,
  gameForPick,
  pickChangeErrorMessage,
} from "./pick-change";
import { loadEligibleWeek, type SubmitMembership, type SubmitPickResult } from "./pick-submit-week";
import { writeUserPick } from "./pick-submit-write";

export type { SubmitMembership, SubmitPickResult };

export async function submitPickForMembership(input: {
  membership: SubmitMembership;
  weekNumber: number;
  teamAbbr: string;
}): Promise<SubmitPickResult> {
  const { membership, weekNumber, teamAbbr } = input;
  const resolved = await loadEligibleWeek(membership, weekNumber);
  if (!resolved.ok) {
    return { ok: false, error: resolved.error, status: resolved.status };
  }

  await ensureWeekLockedEffects(resolved.week.id, { applyBackup: false });
  const week = await prisma.week.findUniqueOrThrow({
    where: { id: resolved.week.id },
    include: { games: true },
  });
  const team = await prisma.team.findUnique({ where: { abbr: teamAbbr } });
  if (!team) return fail("Unknown team", 400);
  const game = week.games.find(
    (g) => g.awayAbbr === teamAbbr || g.homeAbbr === teamAbbr
  );
  if (!game) {
    return fail("That team is on bye or not playing this week", 400);
  }

  const existing = await prisma.pick.findUnique({
    where: {
      membershipId_weekId: { membershipId: membership.id, weekId: week.id },
    },
  });
  const change = evaluatePickChange({
    weekNumber,
    weekLocked: isWeekLocked(week),
    existingPick: existing,
    existingGame: gameForPick(existing, week.games),
    newGame: game,
  });
  if (!change.allowed) {
    const locked =
      change.reason === "week_locked" ||
      change.reason === "current_game_started";
    return fail(pickChangeErrorMessage(change.reason), 403, locked);
  }
  return writeUserPick({
    membership,
    weekId: week.id,
    weekNumber,
    teamAbbr,
    gameId: game.id,
    existing,
  });
}

function fail(error: string, status: number, locked?: boolean): SubmitPickResult {
  return { ok: false, error, status, locked };
}

import "server-only";
import { prisma } from "./db";
import { MISSED_TEAM, parseUsedTeams, rebuildUsedTeams } from "./grading";
import { schedulePickConfirmed } from "./notification-events";
import type { SubmitMembership, SubmitPickResult } from "./pick-submit-week";

export async function writeUserPick(input: {
  membership: SubmitMembership;
  weekId: string;
  weekNumber: number;
  teamAbbr: string;
  gameId: string;
  existing: { teamAbbr: string } | null;
}): Promise<SubmitPickResult> {
  const { membership, weekId, weekNumber, teamAbbr, gameId, existing } = input;
  const prior = await prisma.pick.findMany({
    where: {
      membershipId: membership.id,
      weekId: { not: weekId },
      source: { not: "missed" },
    },
  });
  const seededUsed = parseUsedTeams(membership.usedTeamsJson);
  const usedSet = new Set([
    ...prior.map((p) => p.teamAbbr),
    ...seededUsed.filter((t) => t !== existing?.teamAbbr && t !== MISSED_TEAM),
  ]);
  if (usedSet.has(teamAbbr)) {
    return {
      ok: false,
      error: "You've already used that team this season",
      status: 400,
    };
  }

  const freedTeam =
    existing && existing.teamAbbr !== teamAbbr ? existing.teamAbbr : null;
  const pick = await prisma.pick.upsert({
    where: { membershipId_weekId: { membershipId: membership.id, weekId } },
    create: {
      membershipId: membership.id,
      weekId,
      teamAbbr,
      gameId,
      source: "user",
      result: "pending",
    },
    update: {
      teamAbbr,
      gameId,
      source: "user",
      submittedAt: new Date(),
      result: "pending",
    },
  });
  await rebuildUsedTeams(membership.id, { freedTeam });

  if (!existing || existing.teamAbbr !== teamAbbr) {
    schedulePickConfirmed({
      user: membership.user,
      nickname: membership.nickname,
      weekNumber,
      weekId,
      teamAbbr,
      changed: Boolean(existing && existing.teamAbbr !== teamAbbr),
    });
  }
  return { ok: true, pick, locked: false };
}

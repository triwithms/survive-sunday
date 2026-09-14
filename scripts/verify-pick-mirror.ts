/**
 * Guards for pick-backup copy window (no database).
 *
 *   npx tsx scripts/verify-pick-mirror.ts
 */
import assert from "node:assert/strict";
import {
  bestRemainingRankedTeam,
  decideMirrorCopy,
  decideRankedAutoPick,
  hasOwnPick,
  isMirrorWindowOpen,
  isRankedWindowOpen,
  MIRROR_LEAD_MS,
  RANK_LEAD_MS,
  relevantMirrorDeadline,
  resolvePickBackupMode,
} from "../src/lib/pick-mirror";
import {
  JAJA_SEAT,
  isPendingPracticeEmail,
  needsClaimablePracticeEmail,
  practiceEmailForNickname,
} from "../src/lib/live-roster";
import { isSeatClaimed } from "../src/lib/claim-seat";

const weekLock = new Date("2026-09-18T17:00:00.000Z");
const kcKickoff = new Date("2026-09-14T00:15:00.000Z"); // Mon 8:15 p.m. ET

assert.equal(
  relevantMirrorDeadline({
    weekNumber: 1,
    weekLockAt: weekLock,
    sourceGameKickoff: kcKickoff,
  }).getTime(),
  kcKickoff.getTime(),
  "Week 1 deadline is the source pick’s kickoff"
);

assert.equal(
  relevantMirrorDeadline({
    weekNumber: 2,
    weekLockAt: weekLock,
    sourceGameKickoff: new Date("2026-09-18T20:00:00.000Z"),
  }).getTime(),
  weekLock.getTime(),
  "Week 2 deadline is week lock when it is earlier"
);

assert.equal(
  relevantMirrorDeadline({
    weekNumber: 2,
    weekLockAt: weekLock,
    sourceGameKickoff: null,
  }).getTime(),
  weekLock.getTime()
);

const t30kc = new Date(kcKickoff.getTime() - MIRROR_LEAD_MS);
const t31kc = new Date(kcKickoff.getTime() - MIRROR_LEAD_MS - 1);
const t30lock = new Date(weekLock.getTime() - MIRROR_LEAD_MS);
const t31lock = new Date(weekLock.getTime() - MIRROR_LEAD_MS - 1);
assert.equal(isMirrorWindowOpen(kcKickoff, t30kc), true);
assert.equal(isMirrorWindowOpen(kcKickoff, t31kc), false);
assert.equal(isMirrorWindowOpen(kcKickoff, kcKickoff), true);
assert.equal(
  isMirrorWindowOpen(kcKickoff, new Date(kcKickoff.getTime() + 60_000)),
  true
);

assert.equal(hasOwnPick(null), false);
assert.equal(hasOwnPick({ source: "user", teamAbbr: "LAC" }), true);
assert.equal(hasOwnPick({ source: "missed", teamAbbr: "MISS" }), true);

const base = {
  now: t30lock,
  weekNumber: 2,
  weekLockAt: weekLock,
  existingPick: null as null,
  sourceMembershipId: "gams",
  memberId: "jaja",
  sourcePick: { teamAbbr: "PHI", gameKickoff: weekLock },
  usedTeams: [] as string[],
  teamPlaying: true,
  eliminated: false,
};

assert.deepEqual(decideMirrorCopy(base), { action: "copy", teamAbbr: "PHI" });

assert.deepEqual(
  decideMirrorCopy({ ...base, existingPick: { source: "user", teamAbbr: "DET" } }),
  { action: "skip", reason: "has_pick" }
);

assert.deepEqual(
  decideMirrorCopy({
    ...base,
    now: t31lock,
  }),
  { action: "skip", reason: "too_early" }
);

assert.deepEqual(
  decideMirrorCopy({
    ...base,
    weekNumber: 1,
    now: t31kc,
    sourcePick: { teamAbbr: "KC", gameKickoff: kcKickoff },
  }),
  { action: "skip", reason: "too_early" }
);

assert.deepEqual(
  decideMirrorCopy({
    ...base,
    weekNumber: 1,
    now: t30kc,
    sourcePick: { teamAbbr: "KC", gameKickoff: kcKickoff },
  }),
  { action: "copy", teamAbbr: "KC" }
);

assert.deepEqual(
  decideMirrorCopy({ ...base, sourcePick: null }),
  { action: "skip", reason: "source_no_pick" }
);

assert.deepEqual(
  decideMirrorCopy({ ...base, sourceMembershipId: null }),
  { action: "skip", reason: "no_source_set" }
);

assert.deepEqual(
  decideMirrorCopy({ ...base, sourceMembershipId: "jaja" }),
  { action: "skip", reason: "self" }
);

assert.deepEqual(
  decideMirrorCopy({ ...base, usedTeams: ["PHI"] }),
  { action: "skip", reason: "team_used" }
);

assert.deepEqual(
  decideMirrorCopy({ ...base, teamPlaying: false }),
  { action: "skip", reason: "team_not_playing" }
);

assert.deepEqual(
  decideMirrorCopy({ ...base, eliminated: true }),
  { action: "skip", reason: "eliminated" }
);

assert.equal(JAJA_SEAT.nickname, "JaJa");
assert.equal(JAJA_SEAT.realName, "Jacquie Gama");
assert.equal(JAJA_SEAT.week1Team, "DAL", "JaJa Week 1 is DAL, not KC");
assert.equal(JAJA_SEAT.mirrorFromNickname, "Gams");
assert.equal(JAJA_SEAT.practiceEmail, "jaja@survivesunday.demo");
assert.equal(practiceEmailForNickname("JaJa"), "jaja@survivesunday.demo");
assert.equal(isPendingPracticeEmail("jaja@pending.survivesunday.local"), true);
assert.equal(isPendingPracticeEmail("jaja@survivesunday.demo"), false);
assert.equal(needsClaimablePracticeEmail("jaja@pending.survivesunday.local"), true);
assert.equal(needsClaimablePracticeEmail("jaja@survivesunday.demo"), false);
assert.equal(isSeatClaimed("jaja@survivesunday.demo"), false);
assert.equal(
  isSeatClaimed("jaja@pending.survivesunday.local"),
  true,
  "pending.local falsely looks claimed — never use it for JaJa"
);

assert.equal(resolvePickBackupMode(null, null), "off");
assert.equal(resolvePickBackupMode("off", "gams"), "mirror");
assert.equal(resolvePickBackupMode("mirror", "gams"), "mirror");
assert.equal(resolvePickBackupMode("ranked", null), "ranked");

const t2lock = new Date(weekLock.getTime() - RANK_LEAD_MS);
const t2early = new Date(weekLock.getTime() - RANK_LEAD_MS - 1);
assert.equal(isRankedWindowOpen(weekLock, t2lock), true);
assert.equal(isRankedWindowOpen(weekLock, t2early), false);

const best = bestRemainingRankedTeam({
  now: t2lock,
  usedTeams: ["KC"],
  ranks: [
    { abbr: "KC", priorYearRank: 1 },
    { abbr: "PHI", priorYearRank: 2 },
    { abbr: "DET", priorYearRank: 5 },
    { abbr: "LAC", priorYearRank: 8 },
  ],
  games: [
    { awayAbbr: "KC", homeAbbr: "PHI", status: "scheduled" },
    { awayAbbr: "DET", homeAbbr: "LAC", status: "scheduled" },
  ],
});
assert.equal(best?.teamAbbr, "PHI", "skip used KC; PHI is next-best 2025 rank");

assert.deepEqual(
  decideRankedAutoPick({
    now: t2lock,
    weekLockAt: weekLock,
    existingPick: null,
    eliminated: false,
    teamAbbr: "PHI",
  }),
  { action: "copy", teamAbbr: "PHI" }
);
assert.deepEqual(
  decideRankedAutoPick({
    now: t2early,
    weekLockAt: weekLock,
    existingPick: null,
    eliminated: false,
    teamAbbr: "PHI",
  }),
  { action: "skip", reason: "too_early" }
);
assert.deepEqual(
  decideRankedAutoPick({
    now: t2lock,
    weekLockAt: weekLock,
    existingPick: { source: "user", teamAbbr: "DET" },
    eliminated: false,
    teamAbbr: "PHI",
  }),
  { action: "skip", reason: "has_pick" }
);

console.log("verify-pick-mirror OK");

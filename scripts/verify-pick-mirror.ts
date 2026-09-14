/**
 * Guards for pick-backup copy window (no database).
 *
 *   npx tsx scripts/verify-pick-mirror.ts
 */
import assert from "node:assert/strict";
import {
  decideMirrorCopy,
  hasOwnPick,
  isMirrorWindowOpen,
  MIRROR_LEAD_MS,
  relevantMirrorDeadline,
} from "../src/lib/pick-mirror";
import {
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

console.log("verify-pick-mirror OK");

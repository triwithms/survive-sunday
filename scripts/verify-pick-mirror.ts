/**
 * Guards for ranked pick-backup (~5 min). No database.
 *
 *   npx tsx scripts/verify-pick-mirror.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  bestRemainingRankedTeam,
  decideRankedAutoPick,
  hasOwnPick,
  isRankedWindowOpen,
  RANK_LEAD_MS,
  resolvePickBackupMode,
} from "../src/lib/pick-mirror";
import {
  JAJA_SEAT,
  isPendingPracticeEmail,
  needsClaimablePracticeEmail,
  practiceEmailForNickname,
} from "../src/lib/live-roster";
import { isSeatClaimed } from "../src/lib/claim-seat";
import { MISSING_PICK_REMIND_WINDOW_MS } from "../src/lib/notification-gates";

const weekLock = new Date("2026-09-18T17:00:00.000Z");

assert.equal(RANK_LEAD_MS, 5 * 60 * 1000);
assert.ok(
  MISSING_PICK_REMIND_WINDOW_MS > RANK_LEAD_MS,
  "missing-pick warning must fire before ranked auto"
);

assert.equal(hasOwnPick(null), false);
assert.equal(hasOwnPick({ source: "user", teamAbbr: "LAC" }), true);
assert.equal(hasOwnPick({ source: "missed", teamAbbr: "MISS" }), true);

assert.equal(resolvePickBackupMode(null), "ranked");
assert.equal(resolvePickBackupMode("off"), "off");
assert.equal(resolvePickBackupMode("off", "gams"), "ranked");
assert.equal(resolvePickBackupMode("mirror", "gams"), "ranked");
assert.equal(resolvePickBackupMode("ranked"), "ranked");

const t5lock = new Date(weekLock.getTime() - RANK_LEAD_MS);
const t5early = new Date(weekLock.getTime() - RANK_LEAD_MS - 1);
assert.equal(isRankedWindowOpen(weekLock, t5lock), true);
assert.equal(isRankedWindowOpen(weekLock, t5early), false);
assert.equal(isRankedWindowOpen(weekLock, weekLock), true);

const best = bestRemainingRankedTeam({
  now: t5lock,
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
    now: t5lock,
    weekLockAt: weekLock,
    existingPick: null,
    eliminated: false,
    teamAbbr: "PHI",
  }),
  { action: "copy", teamAbbr: "PHI" }
);
assert.deepEqual(
  decideRankedAutoPick({
    now: t5early,
    weekLockAt: weekLock,
    existingPick: null,
    eliminated: false,
    teamAbbr: "PHI",
  }),
  { action: "skip", reason: "too_early" }
);
assert.deepEqual(
  decideRankedAutoPick({
    now: t5lock,
    weekLockAt: weekLock,
    existingPick: { source: "user", teamAbbr: "DET" },
    eliminated: false,
    teamAbbr: "PHI",
  }),
  { action: "skip", reason: "has_pick" }
);

assert.equal(JAJA_SEAT.nickname, "JaJa");
assert.equal(JAJA_SEAT.realName, "Jacquie Gama");
assert.equal(JAJA_SEAT.week1Team, "DAL", "JaJa Week 1 is DAL, not KC");
assert.equal(JAJA_SEAT.practiceEmail, "jaja@survivesunday.demo");
assert.equal(practiceEmailForNickname("JaJa"), "jaja@survivesunday.demo");
assert.equal(isPendingPracticeEmail("jaja@pending.survivesunday.local"), true);
assert.equal(needsClaimablePracticeEmail("jaja@survivesunday.demo"), false);
assert.equal(isSeatClaimed("jaja@survivesunday.demo"), false);

const radios = readFileSync("src/components/MirrorBackupRadios.tsx", "utf8");
assert.match(radios, /about 5 min/);
assert.doesNotMatch(radios, /Copy from a pool member|within 2 min|30 min/);
const form = readFileSync("src/components/MirrorPicksForm.tsx", "utf8");
assert.match(form, /Never overwrites/);
assert.match(form, /5 minutes before kickoff or lock/);
assert.doesNotMatch(form, /Copy-from|within 30 min|from 2 minutes/);
const vercel = readFileSync("vercel.json", "utf8");
assert.match(vercel, /\/api\/cron\/pick-backup/);
const live = readFileSync("src/lib/live-roster.ts", "utf8");
assert.doesNotMatch(live, /mirrorFromNickname|pickBackup: "mirror"/);
assert.match(
  readFileSync("src/lib/pick-submit.ts", "utf8"),
  /applyBackup:\s*false/
);
assert.match(
  readFileSync("src/components/features/pick/load-pick.ts", "utf8"),
  /applyBackup:\s*false/
);

console.log("verify-pick-mirror OK");

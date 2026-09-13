/**
 * Scores clock / kickoff helpers (no database, no ESPN network).
 *
 *   npx tsx scripts/verify-game-display.ts
 */
import assert from "node:assert/strict";
import {
  espnClockFromNote,
  formatKickoffForScores,
  formatScoreLine,
  formatScoresStatus,
  shouldPollLiveScores,
} from "../src/lib/game-display";

assert.equal(espnClockFromNote("Q3 4:21 · ESPN"), "Q3 4:21");
assert.equal(espnClockFromNote("End of 2nd · ESPN"), "End of 2nd");
assert.equal(espnClockFromNote("Halftime · ESPN"), "Halftime");
assert.equal(espnClockFromNote("OT 8:12 · ESPN"), "OT 8:12");
assert.equal(espnClockFromNote("OT1 3:01 · ESPN"), "OT1 3:01");
assert.equal(espnClockFromNote("Live · ESPN"), null);
assert.equal(espnClockFromNote("Final · ESPN"), null);
assert.equal(espnClockFromNote("Final/OT · ESPN"), "Final/OT");
assert.equal(espnClockFromNote(null), null);
assert.equal(espnClockFromNote("  "), null);

const sundayAfternoon = new Date("2026-09-13T17:00:00.000Z"); // 1:00 p.m. ET
const sundayEvening = new Date("2026-09-13T20:00:00.000Z");
const mondayNight = new Date("2026-09-15T00:15:00.000Z");

const todayLabel = formatKickoffForScores(sundayAfternoon, sundayEvening);
assert.match(todayLabel, /^Today /);
assert.match(todayLabel, /1:00/);
assert.doesNotMatch(todayLabel, /Sep|September|Mon|Tue|Wed|Thu|Fri|Sat|Sun,/);

const laterLabel = formatKickoffForScores(mondayNight, sundayEvening);
assert.doesNotMatch(laterLabel, /^Today /);
assert.match(laterLabel, /Sep|Mon/);

const live = formatScoresStatus({
  status: "live",
  scoreAway: 17,
  scoreHome: 14,
  note: "Q3 4:21 · ESPN",
});
assert.deepEqual(live, { kind: "live", primary: "Q3 4:21", secondary: "LIVE" });

const liveNoClock = formatScoresStatus({
  status: "live",
  scoreAway: 3,
  scoreHome: 0,
  note: "Live · ESPN",
});
assert.deepEqual(liveNoClock, {
  kind: "live",
  primary: "LIVE",
  secondary: null,
});

const endPeriod = formatScoresStatus({
  status: "live",
  scoreAway: 10,
  scoreHome: 10,
  note: "End of 2nd · ESPN",
});
assert.equal(endPeriod.primary, "End of 2nd");
assert.equal(endPeriod.secondary, "LIVE");

const finalGame = formatScoresStatus({
  status: "final",
  scoreAway: 13,
  scoreHome: 10,
  note: "Final · ESPN",
});
assert.deepEqual(finalGame, { kind: "final", primary: "Final", secondary: null });

const finalOt = formatScoresStatus({
  status: "final",
  scoreAway: 24,
  scoreHome: 21,
  note: "Final/OT · ESPN",
});
assert.equal(finalOt.primary, "Final/OT");

const scheduled = formatScoresStatus(
  {
    status: "scheduled",
    scoreAway: null,
    scoreHome: null,
    note: null,
    kickoff: sundayAfternoon,
    network: "CBS",
  },
  sundayEvening
);
assert.equal(scheduled.kind, "scheduled");
assert.match(scheduled.primary, /^Today /);
assert.equal(scheduled.secondary, "CBS");

assert.equal(
  formatScoreLine({
    status: "live",
    scoreAway: 17,
    scoreHome: 14,
    note: "Q3 4:21 · ESPN",
  }),
  "17–14 · Q3 4:21 · ESPN"
);
assert.equal(
  shouldPollLiveScores([{ status: "live", kickoff: new Date() }]),
  true
);

console.log("verify-game-display: ok");

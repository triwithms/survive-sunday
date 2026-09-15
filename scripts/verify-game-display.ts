/**
 * Scores clock / kickoff helpers (no database, no ESPN network).
 *
 *   npx tsx scripts/verify-game-display.ts
 */
import assert from "node:assert/strict";
import {
  espnClockFromNote,
  espnSituationFromNote,
  formatEspnSituation,
  formatKickoffForScores,
  formatLiveScorebug,
  formatMatchupListLine,
  formatScorebugPeriodLine,
  formatScoreLine,
  formatScoresStatus,
  possessionAbbrFromSituation,
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
assert.equal(
  espnClockFromNote("Q4 5:21 · MIA ball · 2nd & 11 · MIA 26 · ESPN"),
  "Q4 5:21"
);
assert.equal(
  espnSituationFromNote("Q4 5:21 · MIA ball · 2nd & 11 · MIA 26 · ESPN"),
  "MIA ball · 2nd & 11 · MIA 26"
);
assert.equal(espnSituationFromNote("Q3 4:21 · ESPN"), null);
assert.equal(
  formatEspnSituation({
    possession: "12",
    shortDownDistanceText: "2nd & 7",
    possessionText: "KC 33",
  }),
  "KC ball · 2nd & 7 · KC 33"
);
assert.equal(
  formatEspnSituation({
    possession: "15",
    shortDownDistanceText: "2nd & 11",
    possessionText: "MIA 26",
    down: 2,
    distance: 11,
  }),
  "MIA ball · 2nd & 11 · MIA 26"
);
assert.equal(
  formatEspnSituation({
    possession: "21",
    shortDownDistanceText: "2nd & 8",
    possessionText: "WSH 45",
  }),
  "PHI ball · 2nd & 8 · WAS 45"
);
assert.equal(formatEspnSituation(null), null);
assert.equal(formatEspnSituation({}), null);
assert.equal(possessionAbbrFromSituation("KC ball · 2nd & 7 · KC 33"), "KC");
assert.equal(possessionAbbrFromSituation(null), null);
assert.equal(formatScorebugPeriodLine("Q4 9:00"), "4TH | 9:00");
assert.equal(formatScorebugPeriodLine("Q1 12:00"), "1ST | 12:00");
assert.equal(formatScorebugPeriodLine("OT 8:12"), "OT | 8:12");
assert.equal(formatScorebugPeriodLine("Halftime"), "HALF");
assert.equal(formatScorebugPeriodLine("End of 2nd"), "END 2ND");
assert.deepEqual(
  formatLiveScorebug("Q4 9:00 · MIN ball · 1st & 10 · GB 40 · ESPN"),
  {
    down: "1ST & 10",
    periodLine: "4TH | 9:00",
    spot: "GB 40",
    possession: "MIN",
  }
);
assert.deepEqual(formatLiveScorebug("Q3 4:21 · ESPN"), {
  down: null,
  periodLine: "3RD | 4:21",
  spot: null,
  possession: null,
});
assert.deepEqual(formatLiveScorebug("Live · ESPN"), {
  down: null,
  periodLine: null,
  spot: null,
  possession: null,
});

const sundayAfternoon = new Date("2026-09-13T17:00:00.000Z"); // 1:00 p.m. ET
const sundayEvening = new Date("2026-09-13T20:00:00.000Z");
const mondayNight = new Date("2026-09-15T00:15:00.000Z");

const todayLabel = formatKickoffForScores(sundayAfternoon, sundayEvening);
assert.match(todayLabel, /^Today /);
assert.match(todayLabel, /1:00/);
assert.doesNotMatch(todayLabel, /Sep|September|Mon|Tue|Wed|Thu|Fri|Sat|Sun,/);

const laterLabel = formatKickoffForScores(mondayNight, sundayEvening);
assert.doesNotMatch(laterLabel, /^Today /);
assert.match(laterLabel, /Mon/);
assert.doesNotMatch(laterLabel, /Sep|September/);

const live = formatScoresStatus({
  status: "live",
  scoreAway: 17,
  scoreHome: 14,
  note: "Q3 4:21 · ESPN",
});
assert.deepEqual(live, {
  kind: "live",
  primary: "Q3 4:21",
  secondary: "LIVE",
  situation: null,
});

const liveSit = formatScoresStatus({
  status: "live",
  scoreAway: 13,
  scoreHome: 27,
  note: "Q4 5:21 · MIA ball · 2nd & 11 · MIA 26 · ESPN",
});
assert.deepEqual(liveSit, {
  kind: "live",
  primary: "Q4 5:21",
  secondary: "LIVE",
  situation: "MIA ball · 2nd & 11 · MIA 26",
});

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
  situation: null,
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
assert.deepEqual(finalGame, {
  kind: "final",
  primary: "Final",
  secondary: null,
  situation: null,
});

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
    "17–14 · Q3 4:21"
);
assert.equal(
  formatMatchupListLine({
    status: "live",
    scoreAway: 17,
    scoreHome: 14,
    note: "2Q 8:32 · BUF ball · 2nd & 7 · BUF 26 · ESPN",
  }),
  "LIVE 17–14"
);
assert.equal(
  formatMatchupListLine({
    status: "final",
    scoreAway: 24,
    scoreHome: 10,
    note: "Final · ESPN",
  }),
  "Final 24–10"
);
assert.equal(
  formatMatchupListLine({
    status: "scheduled",
    scoreAway: null,
    scoreHome: null,
    note: "9/17 - 8:15 PM EDT · ESPN",
  }),
  null
);
assert.doesNotMatch(
  formatMatchupListLine({
    status: "live",
    scoreAway: 3,
    scoreHome: 0,
    note: "Q2 3:12 · DET ball · 1st & 10 · DET 25 · ESPN",
  }) ?? "",
  /Q2|1st|DET ball/
);
assert.equal(
  shouldPollLiveScores([{ status: "live", kickoff: new Date() }]),
  true
);

console.log("verify-game-display: ok");

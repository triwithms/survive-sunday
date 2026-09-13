/**
 * Checks ESPN public scoreboard + injury parse without touching the DB.
 * Usage: npx tsx scripts/verify-live-feeds.ts
 */
import { parseEspnInjuries, type EspnInjuriesPayload } from "../src/lib/live-injuries";
import { fetchEspnJson, normAbbr } from "../src/lib/espn";
import {
  formatInjuryChip,
  formatScoreLine,
  shouldPollLiveScores,
} from "../src/lib/game-display";

const fixture: EspnInjuriesPayload = {
  timestamp: "2026-09-13T12:00:00Z",
  injuries: [
    {
      id: "22",
      displayName: "Arizona Cardinals",
      injuries: [
        {
          status: "Questionable",
          date: "2026-09-13T10:40Z",
          shortComment: "Listed as questionable for Sunday.",
          athlete: {
            displayName: "Parser Fixture Player",
            position: { abbreviation: "RB" },
          },
          details: { type: "Ankle", detail: "Sprain" },
        },
        {
          status: "Active",
          athlete: { displayName: "Should Be Dropped" },
          details: { type: "Shoulder" },
        },
      ],
    },
  ],
};

function assert(cond: unknown, msg: string) {
  if (!cond) {
    throw new Error(msg);
  }
}

const parsed = parseEspnInjuries(fixture);
assert(parsed.length === 1, `expected 1 watch-status row, got ${parsed.length}`);
assert(parsed[0].teamAbbr === "ARI", `team ${parsed[0].teamAbbr}`);
assert(parsed[0].player === "Parser Fixture Player", "player name");
assert(parsed[0].status === "Questionable", "status");
assert(parsed[0].injury.includes("Ankle"), "injury type");
assert(
  formatInjuryChip({ out: 2, doubtful: 0, questionable: 1 }) === "2 Out · 1 Q",
  "injury chip"
);
assert(
  formatScoreLine({
    status: "live",
    scoreAway: 17,
    scoreHome: 14,
    note: "Q3 4:21 · ESPN",
  }) === "17–14 · Q3 4:21 · ESPN",
  "live score line"
);
assert(
  shouldPollLiveScores([{ status: "live", kickoff: new Date() }]) === true,
  "poll when live"
);
assert(
  shouldPollLiveScores([
    { status: "final", kickoff: new Date(Date.now() - 60 * 60 * 1000) },
  ]) === false,
  "no poll when all final"
);

console.log("parse + display helpers: ok");

const board = await fetchEspnJson<{
  events?: Array<{
    name?: string;
    status?: { type?: { state?: string; shortDetail?: string } };
    competitions?: Array<{
      competitors?: Array<{
        homeAway: string;
        score?: string;
        team?: { abbreviation?: string };
      }>;
    }>;
  }>;
}>(
  "/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&week=1&year=2026"
);
const events = board.events || [];
assert(events.length >= 8, `scoreboard events ${events.length}`);
const finals = events.filter(
  (e) => (e.status?.type?.state || "").toLowerCase() === "post"
);
console.log(
  `scoreboard week 1: ${events.length} games, ${finals.length} final, source ESPN`
);
for (const e of finals.slice(0, 4)) {
  const comps = e.competitions?.[0]?.competitors || [];
  const away = comps.find((c) => c.homeAway === "away");
  const home = comps.find((c) => c.homeAway === "home");
  console.log(
    `  ${normAbbr(away?.team?.abbreviation || "?")} ${away?.score ?? "–"} @ ${normAbbr(home?.team?.abbreviation || "?")} ${home?.score ?? "–"} (${e.status?.type?.shortDetail || "Final"})`
  );
}

const payload = await fetchEspnJson<EspnInjuriesPayload>(
  "/apis/site/v2/sports/football/nfl/injuries",
  { timeoutMs: 12000 }
);
const live = parseEspnInjuries(payload);
assert(live.length > 0, "live injury feed empty");
const stubNames = /sample|fictional|placeholder|example player/i;
assert(
  live.every((r) => !stubNames.test(r.player)),
  "injury feed contained stub names"
);
const byStatus = live.reduce<Record<string, number>>((acc, r) => {
  acc[r.status] = (acc[r.status] || 0) + 1;
  return acc;
}, {});
console.log(`injuries: ${live.length} watch-status rows`, byStatus);
console.log("verify-live-feeds: ok");

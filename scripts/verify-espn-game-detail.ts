/**
 * ESPN game-detail parser (no network).
 *
 *   npx tsx scripts/verify-espn-game-detail.ts
 */
import assert from "node:assert/strict";
import { parseEspnGameSummary } from "../src/lib/espn-game-detail-parse";

const parsed = parseEspnGameSummary({
  scoringPlays: [
    {
      text: "Jack Bech 15 Yd pass from Kirk Cousins (Matt Gay Kick)",
      awayScore: 0,
      homeScore: 7,
      type: { text: "Passing Touchdown", abbreviation: "TD" },
      scoringType: { abbreviation: "TD" },
      period: { number: 1 },
      clock: { displayValue: "1:33" },
      team: { abbreviation: "LV" },
    },
    {
      text: "",
      team: { abbreviation: "MIA" },
    },
  ],
  drives: {
    current: {
      description: "3 plays, -5 yards, 0:19",
      team: { abbreviation: "LV" },
      displayResult: "In Progress",
      yards: -5,
    },
    previous: [
      {
        description: "8 plays, 31 yards, 4:29",
        team: { abbreviation: "MIA" },
        displayResult: "Punt",
        yards: 31,
      },
    ],
  },
  leaders: [
    {
      team: { abbreviation: "LV" },
      leaders: [
        {
          name: "passingYards",
          displayName: "Passing Yards",
          leaders: [
            {
              displayValue: "21/30, 160 YDS, 3 TD",
              athlete: { displayName: "Kirk Cousins" },
            },
          ],
        },
        {
          name: "totalTackles",
          leaders: [
            {
              displayValue: "6",
              athlete: { displayName: "Treydan Stukes" },
            },
          ],
        },
        {
          name: "ignoredCategory",
          leaders: [
            { displayValue: "99", athlete: { displayName: "Nope" } },
          ],
        },
      ],
    },
  ],
});

assert.equal(parsed.scoringPlays.length, 1);
assert.equal(parsed.scoringPlays[0].teamAbbr, "LV");
assert.equal(parsed.scoringPlays[0].type, "TD");
assert.equal(parsed.scoringPlays[0].period, "Q1");
assert.equal(parsed.scoringPlays[0].clock, "1:33");
assert.equal(parsed.currentDrive?.teamAbbr, "LV");
assert.equal(parsed.currentDrive?.description, "3 plays, -5 yards, 0:19");
assert.equal(parsed.recentDrives.length, 1);
assert.equal(parsed.recentDrives[0].result, "Punt");
assert.equal(parsed.leaders.length, 2);
assert.equal(parsed.leaders[0].category, "Passing");
assert.equal(parsed.leaders[0].player, "Kirk Cousins");
assert.equal(parsed.leaders[1].category, "Tackles");

const empty = parseEspnGameSummary({});
assert.deepEqual(empty.scoringPlays, []);
assert.equal(empty.currentDrive, null);
assert.deepEqual(empty.leaders, []);

console.log("verify-espn-game-detail: ok");

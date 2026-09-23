/**
 * Unused-team list + week options for Admin enter-pick (no DB).
 *
 *   npx tsx scripts/verify-enter-pick.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  memberWeekPick,
  unusedTeamsForWeek,
  pickForWeek,
} from "../src/components/features/admin/enter-pick-options";
import { enterPickStatusError } from "../src/lib/enter-pick-status";
import { allowedEnterPickWeeks } from "../src/lib/enter-pick-week";

function kick(hoursAgo: number) {
  return new Date(Date.now() - hoursAgo * 3600 * 1000);
}

function week(number: number, locked: boolean, started: boolean) {
  return {
    number,
    locked,
    games: [
      {
        id: `w${number}-1`,
        awayAbbr: "DET",
        homeAbbr: "CHI",
        status: started ? "live" : "scheduled",
        kickoff: started ? kick(2) : new Date(Date.now() + 86400000),
      },
    ],
  };
}

function main() {
  const gams = {
    id: "g",
    nickname: "Gams",
    realName: "Robert",
    status: "undefeated",
    usedTeams: ["DET"],
    picks: [
      { weekNumber: 1, teamAbbr: "DET" },
      { weekNumber: 2, teamAbbr: "PHI" },
    ],
    allowedWeeks: [1, 2],
  };
  const week2 = [
    { abbr: "PHI", name: "PHI Eagles vs KC" },
    { abbr: "KC", name: "KC Chiefs @ PHI" },
    { abbr: "DET", name: "DET Lions vs CHI" },
    { abbr: "BUF", name: "BUF Bills vs NYJ" },
  ];
  const unused = unusedTeamsForWeek({
    weekTeams: week2,
    member: gams,
    weekNumber: 2,
  });
  const abbrs = unused.map((t) => t.abbr).join(",");
  assert.ok(abbrs.includes("PHI"), "current week pick stays selectable");
  assert.ok(abbrs.includes("KC") && abbrs.includes("BUF"), "fresh teams");
  assert.ok(!abbrs.includes("DET"), "week 1 team is used");
  assert.equal(pickForWeek(gams, 2), "PHI");

  const afterMiss = unusedTeamsForWeek({
    weekTeams: week2,
    member: {
      ...gams,
      picks: [{ weekNumber: 1, teamAbbr: "MISS" }],
      usedTeams: [],
    },
    weekNumber: 2,
  });
  assert.ok(afterMiss.some((t) => t.abbr === "DET"), "MISS is not a used team");

  const weeks = [week(1, true, true), week(2, false, false), week(3, false, false), week(5, false, false)];
  const currentOpen = allowedEnterPickWeeks({
    currentWeek: 2,
    weeks,
    member: { picks: [{ weekNumber: 2, teamAbbr: "PHI", source: "user" }] },
  });
  assert.deepEqual(currentOpen, [1, 2], "no next week while own game is pending");

  const unlocked = allowedEnterPickWeeks({
    currentWeek: 2,
    weeks: [week(1, true, true), week(2, false, true), week(3, false, false), week(5, false, false)],
    member: { picks: [{ weekNumber: 2, teamAbbr: "DET", source: "user", gameId: "w2-1" }] },
    now: new Date(),
  });
  assert.ok(unlocked.includes(3), "own game started + valid pick opens next week");
  assert.ok(!unlocked.includes(5), "far-future weeks stay hidden");

  const noPick = allowedEnterPickWeeks({
    currentWeek: 2,
    weeks,
    member: { picks: [] },
  });
  assert.deepEqual(noPick, [1, 2], "no pick yet — stay on current week");

  assert.equal(enterPickStatusError("eliminated"), "Out — no pick.");
  assert.equal(enterPickStatusError("undefeated"), null);
  assert.equal(enterPickStatusError("one_loss"), null);
  assert.equal(memberWeekPick([gams], "g", 2), "PHI");
  assert.equal(memberWeekPick([gams], "missing", 2), null);

  const gate = readFileSync("src/lib/enter-pick-week-db.ts", "utf8");
  assert.match(gate, /enterPickStatusError/);
  const save = readFileSync("src/components/features/admin/use-enter-pick.ts", "utf8");
  assert.match(save, /\/api\/admin\/import-picks/);
  assert.match(save, /enterPick: true/);

  console.log("verify-enter-pick OK");
}

main();

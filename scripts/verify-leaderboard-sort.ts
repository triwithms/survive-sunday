/**
 * Leaderboard season-race order (no database).
 *
 *   npx tsx scripts/verify-leaderboard-sort.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { sortBoard } from "../src/components/features/board/sort-board";
import {
  pickWinMargin,
  winMarginByMember,
} from "../src/components/features/board/win-margin";

function mustInclude(path: string, needles: string[]) {
  const src = readFileSync(path, "utf8");
  for (const needle of needles) {
    assert.ok(src.includes(needle), `${path} must include ${needle}`);
  }
}

mustInclude("src/components/features/board/load-board.ts", [
  "sortBoard",
  "winMarginByMember",
]);
mustInclude("src/components/features/board/BoardHeading.tsx", [
  "showWeekInTitle={false}",
  'titleRest="Leaderboard"',
]);
mustInclude("src/components/features/board/board-copy.ts", [
  "still in, then out",
]);
mustInclude("src/components/HeaderWeekBadge.tsx", [
  "isLeaderboardPath",
]);
assert.doesNotMatch(
  readFileSync("src/components/features/board/BoardScreen.tsx", "utf8"),
  /points|fantasy/i,
  "Leaderboard must not grow a pick’em points column"
);

type Row = {
  nickname: string;
  status: string;
  weeksSurvived: number;
  losses: number;
  autoPickStamps?: number | null;
  winMargin?: number;
};

function nicknames(rows: Row[]): string[] {
  return sortBoard(rows).map((r) => r.nickname);
}

const kcWin = {
  teamAbbr: "KC",
  result: "win" as const,
  game: {
    awayAbbr: "DEN",
    homeAbbr: "KC",
    scoreAway: 20,
    scoreHome: 27,
    status: "final",
  },
};
const pendingSun = {
  teamAbbr: "LAC",
  result: null,
  game: {
    awayAbbr: "LV",
    homeAbbr: "LAC",
    scoreAway: null,
    scoreHome: null,
    status: "scheduled",
  },
};

assert.equal(pickWinMargin(kcWin), 7);
assert.equal(pickWinMargin(pendingSun), 0);
assert.equal(
  pickWinMargin({
    teamAbbr: "LAC",
    result: null,
    game: {
      awayAbbr: "LV",
      homeAbbr: "LAC",
      scoreAway: 10,
      scoreHome: 24,
      status: "final",
    },
  }),
  14,
  "final win counts even if result is not graded yet"
);
assert.equal(
  pickWinMargin({
    teamAbbr: "LV",
    result: "loss",
    game: {
      awayAbbr: "LV",
      homeAbbr: "LAC",
      scoreAway: 10,
      scoreHome: 24,
      status: "final",
    },
  }),
  0,
  "losing picks add no margin"
);

const margins = winMarginByMember([
  { membershipId: "gams", ...kcWin },
  { membershipId: "gams", ...pendingSun },
  { membershipId: "colin", ...pendingSun },
]);
assert.equal(margins.get("gams"), 7);
assert.equal(margins.get("colin"), 0);

// Alive first — MOV cannot lift an eliminated player over someone still in.
assert.deepEqual(
  nicknames([
    {
      nickname: "Out",
      status: "eliminated",
      weeksSurvived: 8,
      losses: 2,
      winMargin: 99,
    },
    {
      nickname: "In",
      status: "one_loss",
      weeksSurvived: 1,
      losses: 1,
      winMargin: 0,
    },
  ]),
  ["In", "Out"]
);

// Fewest losses, then most weeks survived.
assert.deepEqual(
  nicknames([
    { nickname: "Zed", status: "undefeated", weeksSurvived: 1, losses: 0 },
    { nickname: "Ann", status: "undefeated", weeksSurvived: 3, losses: 0 },
    { nickname: "Mo", status: "one_loss", weeksSurvived: 4, losses: 1 },
  ]),
  ["Ann", "Zed", "Mo"]
);

// Among equals: clean record before 💩, then live MOV, then nickname.
assert.deepEqual(
  nicknames([
    {
      nickname: "Zoe",
      status: "undefeated",
      weeksSurvived: 1,
      losses: 0,
      autoPickStamps: 0,
      winMargin: 0,
    },
    {
      nickname: "Ada",
      status: "undefeated",
      weeksSurvived: 1,
      losses: 0,
      autoPickStamps: 1,
      winMargin: 21,
    },
    {
      nickname: "Bea",
      status: "undefeated",
      weeksSurvived: 1,
      losses: 0,
      autoPickStamps: 0,
      winMargin: 7,
    },
  ]),
  ["Bea", "Zoe", "Ada"]
);

console.log("verify-leaderboard-sort OK");

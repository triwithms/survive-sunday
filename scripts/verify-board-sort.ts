/**
 * Survival board / standings list order (no database).
 *
 *   npx tsx scripts/verify-board-sort.ts
 */
import assert from "node:assert/strict";
import { sortParticipants } from "../src/lib/tiebreak";

type Row = {
  nickname: string;
  status: string;
  weeksSurvived: number;
  losses: number;
};

function nicknames(rows: Row[]): string[] {
  return sortParticipants(rows).map((r) => r.nickname);
}

// Owner Week 1 case: all Undefeated; Daddy Chill (SEA WIN, weeksSurvived 1)
// must rank above Black Cobra / Cannoli / Colin (LAC PENDING, weeksSurvived 0).
assert.deepEqual(
  nicknames([
    { nickname: "Black Cobra", status: "undefeated", weeksSurvived: 0, losses: 0 },
    { nickname: "Cannoli", status: "undefeated", weeksSurvived: 0, losses: 0 },
    { nickname: "Colin", status: "undefeated", weeksSurvived: 0, losses: 0 },
    { nickname: "Daddy Chill", status: "undefeated", weeksSurvived: 1, losses: 0 },
  ]),
  ["Daddy Chill", "Black Cobra", "Cannoli", "Colin"]
);

// Status tier still wins over weeks survived.
assert.deepEqual(
  nicknames([
    { nickname: "Zed", status: "eliminated", weeksSurvived: 8, losses: 2 },
    { nickname: "Ann", status: "one_loss", weeksSurvived: 1, losses: 1 },
    { nickname: "Mo", status: "undefeated", weeksSurvived: 0, losses: 0 },
  ]),
  ["Mo", "Ann", "Zed"]
);

// Same status: fewer losses after weeks survived.
assert.deepEqual(
  nicknames([
    { nickname: "Bee", status: "one_loss", weeksSurvived: 3, losses: 1 },
    { nickname: "Ace", status: "one_loss", weeksSurvived: 3, losses: 1 },
    { nickname: "Cal", status: "one_loss", weeksSurvived: 3, losses: 0 },
  ]),
  ["Cal", "Ace", "Bee"]
);

console.log("verify-board-sort OK");

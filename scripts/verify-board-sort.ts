/**
 * Survival board / standings list order (no database).
 *
 *   npx tsx scripts/verify-board-sort.ts
 */
import assert from "node:assert/strict";
import { boardPickFields, sortParticipants } from "../src/lib/tiebreak";

type Row = {
  nickname: string;
  status: string;
  weeksSurvived: number;
  losses: number;
  pickTeamAbbr?: string | null;
  pickGameKickoff?: Date | string | number | null;
};

function nicknames(rows: Row[]): string[] {
  return sortParticipants(rows).map((r) => r.nickname);
}

function assertContiguous(order: string[], group: string[]) {
  const idxs = group.map((n) => order.indexOf(n));
  assert.ok(
    idxs.every((i) => i >= 0),
    `missing name in order: ${group.join(", ")} vs ${order.join(", ")}`
  );
  const min = Math.min(...idxs);
  const max = Math.max(...idxs);
  assert.equal(
    max - min + 1,
    group.length,
    `${group.join(", ")} should be contiguous in ${order.join(", ")}`
  );
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

// Real Week 1 slate times: KC is TNF; LAC / SEA / DET share Sunday 4:25 ET;
// JAX is Monday night.
const kcKickoff = "2026-09-10T00:20:00.000Z";
const sundayLate = "2026-09-13T20:25:00.000Z";
const jaxKickoff = "2026-09-15T00:15:00.000Z";

// Owner follow-up: Gams (KC pending) must not sit alphabetically between LAC
// names. Steve / Daddy Chill (weeksSurvived 1) stay above 0-week rows.
const ownerBoard = nicknames([
  {
    nickname: "Black Cobra",
    status: "undefeated",
    weeksSurvived: 0,
    losses: 0,
    pickTeamAbbr: "LAC",
    pickGameKickoff: sundayLate,
  },
  {
    nickname: "Cannoli Stuffer",
    status: "undefeated",
    weeksSurvived: 0,
    losses: 0,
    pickTeamAbbr: "LAC",
    pickGameKickoff: sundayLate,
  },
  {
    nickname: "Colin",
    status: "undefeated",
    weeksSurvived: 0,
    losses: 0,
    pickTeamAbbr: "LAC",
    pickGameKickoff: sundayLate,
  },
  {
    nickname: "Daddy Chill",
    status: "undefeated",
    weeksSurvived: 1,
    losses: 0,
    pickTeamAbbr: "SEA",
    pickGameKickoff: sundayLate,
  },
  {
    nickname: "Deep and Delicious",
    status: "undefeated",
    weeksSurvived: 0,
    losses: 0,
    pickTeamAbbr: "JAX",
    pickGameKickoff: jaxKickoff,
  },
  {
    nickname: "Gams",
    status: "undefeated",
    weeksSurvived: 0,
    losses: 0,
    pickTeamAbbr: "KC",
    pickGameKickoff: kcKickoff,
  },
  {
    nickname: "Gdogss",
    status: "undefeated",
    weeksSurvived: 0,
    losses: 0,
    pickTeamAbbr: "LAC",
    pickGameKickoff: sundayLate,
  },
  {
    nickname: "JimmyC",
    status: "undefeated",
    weeksSurvived: 0,
    losses: 0,
    pickTeamAbbr: "JAX",
    pickGameKickoff: jaxKickoff,
  },
  {
    nickname: "Long Snapper",
    status: "undefeated",
    weeksSurvived: 0,
    losses: 0,
    pickTeamAbbr: "JAX",
    pickGameKickoff: jaxKickoff,
  },
  {
    nickname: "Steve",
    status: "undefeated",
    weeksSurvived: 1,
    losses: 0,
    pickTeamAbbr: "DET",
    pickGameKickoff: sundayLate,
  },
]);

assert.deepEqual(ownerBoard, [
  "Steve",
  "Daddy Chill",
  "Gams",
  "Black Cobra",
  "Cannoli Stuffer",
  "Colin",
  "Gdogss",
  "Deep and Delicious",
  "JimmyC",
  "Long Snapper",
]);
assertContiguous(ownerBoard, [
  "Black Cobra",
  "Cannoli Stuffer",
  "Colin",
  "Gdogss",
]);
assert.ok(
  ownerBoard.indexOf("Gams") < ownerBoard.indexOf("Black Cobra"),
  "Gams (KC) should not sit among LAC pending rows"
);
assert.ok(
  ownerBoard.indexOf("Steve") < ownerBoard.indexOf("Gams"),
  "Steve (weeksSurvived 1) stays above 0-week rows"
);
assert.ok(
  ownerBoard.indexOf("Daddy Chill") < ownerBoard.indexOf("Gams"),
  "Daddy Chill (weeksSurvived 1) stays above 0-week rows"
);

// Same game: LAC and LV share a kickoff — cluster, then pick abbr, then A–Z.
assert.deepEqual(
  nicknames([
    {
      nickname: "Zoe",
      status: "undefeated",
      weeksSurvived: 0,
      losses: 0,
      pickTeamAbbr: "LV",
      pickGameKickoff: sundayLate,
    },
    {
      nickname: "Ava",
      status: "undefeated",
      weeksSurvived: 0,
      losses: 0,
      pickTeamAbbr: "LAC",
      pickGameKickoff: sundayLate,
    },
    {
      nickname: "Bob",
      status: "undefeated",
      weeksSurvived: 0,
      losses: 0,
      pickTeamAbbr: "LAC",
      pickGameKickoff: sundayLate,
    },
  ]),
  ["Ava", "Bob", "Zoe"]
);

// No-pick / pending-without-team last within the same status / weeks / losses.
assert.deepEqual(
  nicknames([
    {
      nickname: "Mo",
      status: "undefeated",
      weeksSurvived: 0,
      losses: 0,
      pickTeamAbbr: null,
    },
    {
      nickname: "Ann",
      status: "undefeated",
      weeksSurvived: 0,
      losses: 0,
      pickTeamAbbr: "LAC",
      pickGameKickoff: sundayLate,
    },
    {
      nickname: "Bea",
      status: "undefeated",
      weeksSurvived: 0,
      losses: 0,
      pickTeamAbbr: "LAC",
      pickGameKickoff: sundayLate,
    },
    {
      nickname: "Ned",
      status: "undefeated",
      weeksSurvived: 0,
      losses: 0,
      ...boardPickFields({ teamAbbr: "", source: "user" }),
    },
    {
      nickname: "Pat",
      status: "undefeated",
      weeksSurvived: 0,
      losses: 0,
      ...boardPickFields({ teamAbbr: "MISS", source: "missed" }),
    },
  ]),
  ["Ann", "Bea", "Mo", "Ned", "Pat"]
);

// boardPickFields resolves kickoff from the week slate when pick.game is missing.
const resolved = boardPickFields({ teamAbbr: "KC", source: "imported" }, [
  { id: "2026-w1-01", awayAbbr: "BAL", homeAbbr: "KC", kickoff: kcKickoff },
]);
assert.equal(resolved.pickTeamAbbr, "KC");
assert.equal(resolved.pickGameKickoff, kcKickoff);

console.log("verify-board-sort OK");

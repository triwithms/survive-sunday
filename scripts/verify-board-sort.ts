/**
 * Survival board / standings list order (no database).
 * Home/Pool week pick clusters, Scores “Participants’ picks”, and GET /api/picks
 * reuse sortParticipants — do not add a second comparator.
 *
 *   npx tsx scripts/verify-board-sort.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { boardPickFields, sortParticipants } from "../src/lib/tiebreak";

function assertUsesSharedSort(path: string, extra: string[]) {
  const src = readFileSync(path, "utf8");
  assert.match(src, /sortParticipants/, `${path} must reuse sortParticipants`);
  for (const needle of extra) {
    assert.ok(src.includes(needle), `${path} must include ${needle}`);
  }
}

assertUsesSharedSort("src/app/(app)/standings/page.tsx", []);
assertUsesSharedSort("src/app/(app)/pool/page.tsx", [
  "sorted.filter",
]);
assert.doesNotMatch(
  readFileSync("src/app/(app)/pool/page.tsx", "utf8"),
  /byNickname/,
  "Home/Pool must not keep a nickname-only pick-list sort"
);
assertUsesSharedSort("src/app/(app)/scores/page.tsx", ["boardPickFields"]);
assertUsesSharedSort("src/app/api/picks/route.ts", ["boardPickFields"]);

type Row = {
  nickname: string;
  status: string;
  weeksSurvived: number;
  losses: number;
  pickTeamAbbr?: string | null;
  pickGameKickoff?: Date | string | number | null;
  pickGameId?: string | null;
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

// Real Week 1 slate times: KC is TNF; LAC / SEA / DET share Sunday 4:25 ET;
// JAX is Monday night.
const kcKickoff = "2026-09-10T00:20:00.000Z";
const sundayLate = "2026-09-13T20:25:00.000Z";
const jaxKickoff = "2026-09-15T00:15:00.000Z";

// No-pick rows: nickname A–Z. Status / weeks survived must not reorder.
assert.deepEqual(
  nicknames([
    { nickname: "Black Cobra", status: "undefeated", weeksSurvived: 0, losses: 0 },
    { nickname: "Cannoli", status: "undefeated", weeksSurvived: 0, losses: 0 },
    { nickname: "Colin", status: "undefeated", weeksSurvived: 0, losses: 0 },
    { nickname: "Daddy Chill", status: "undefeated", weeksSurvived: 1, losses: 0 },
  ]),
  ["Black Cobra", "Cannoli", "Colin", "Daddy Chill"]
);

assert.deepEqual(
  nicknames([
    { nickname: "Zed", status: "eliminated", weeksSurvived: 8, losses: 2 },
    { nickname: "Ann", status: "one_loss", weeksSurvived: 1, losses: 1 },
    { nickname: "Mo", status: "undefeated", weeksSurvived: 0, losses: 0 },
  ]),
  ["Ann", "Mo", "Zed"]
);

// Owner correction: same pick stays clustered even when status differs.
// Status-first (PR #38) split LAC across undefeated vs one_loss.
const mixedStatusLac = nicknames([
  {
    nickname: "Zed",
    status: "undefeated",
    weeksSurvived: 1,
    losses: 0,
    pickTeamAbbr: "LAC",
    pickGameKickoff: sundayLate,
    pickGameId: "2026-w1-lac",
  },
  {
    nickname: "Ann",
    status: "eliminated",
    weeksSurvived: 0,
    losses: 2,
    pickTeamAbbr: "LAC",
    pickGameKickoff: sundayLate,
    pickGameId: "2026-w1-lac",
  },
  {
    nickname: "Mo",
    status: "one_loss",
    weeksSurvived: 0,
    losses: 1,
    pickTeamAbbr: "DET",
    pickGameKickoff: sundayLate,
    pickGameId: "2026-w1-det",
  },
  {
    nickname: "Bea",
    status: "one_loss",
    weeksSurvived: 3,
    losses: 1,
    pickTeamAbbr: "LAC",
    pickGameKickoff: sundayLate,
    pickGameId: "2026-w1-lac",
  },
]);
assert.deepEqual(mixedStatusLac, ["Mo", "Ann", "Bea", "Zed"]);
assertContiguous(mixedStatusLac, ["Ann", "Bea", "Zed"]);

// Primary: pick team abbr (DET → JAX → KC → LAC → SEA). Same pick contiguous.
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
    status: "one_loss",
    weeksSurvived: 1,
    losses: 1,
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
    status: "one_loss",
    weeksSurvived: 0,
    losses: 1,
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
  "Deep and Delicious",
  "JimmyC",
  "Long Snapper",
  "Gams",
  "Black Cobra",
  "Cannoli Stuffer",
  "Colin",
  "Gdogss",
  "Daddy Chill",
]);
assertContiguous(ownerBoard, [
  "Black Cobra",
  "Cannoli Stuffer",
  "Colin",
  "Gdogss",
]);
assert.ok(
  ownerBoard.indexOf("Gams") < ownerBoard.indexOf("Black Cobra"),
  "Gams (KC) should not sit among LAC rows"
);
assert.ok(
  ownerBoard.indexOf("Gdogss") === ownerBoard.indexOf("Colin") + 1,
  "one-loss Gdogss stays with the other LAC picks"
);

// Same game: LAC and LV share a kickoff — cluster by pick abbr, then A–Z.
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
      status: "one_loss",
      weeksSurvived: 0,
      losses: 1,
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

// Same pick + same kickoff: game id keeps matchups apart, then nickname.
assert.deepEqual(
  nicknames([
    {
      nickname: "Bee",
      status: "undefeated",
      weeksSurvived: 0,
      losses: 0,
      pickTeamAbbr: "LAC",
      pickGameKickoff: sundayLate,
      pickGameId: "game-b",
    },
    {
      nickname: "Ace",
      status: "one_loss",
      weeksSurvived: 2,
      losses: 1,
      pickTeamAbbr: "LAC",
      pickGameKickoff: sundayLate,
      pickGameId: "game-a",
    },
  ]),
  ["Ace", "Bee"]
);

// No-pick / missed last, regardless of status.
assert.deepEqual(
  nicknames([
    {
      nickname: "Mo",
      status: "undefeated",
      weeksSurvived: 4,
      losses: 0,
      pickTeamAbbr: null,
    },
    {
      nickname: "Ann",
      status: "one_loss",
      weeksSurvived: 0,
      losses: 1,
      pickTeamAbbr: "LAC",
      pickGameKickoff: sundayLate,
    },
    {
      nickname: "Bea",
      status: "eliminated",
      weeksSurvived: 0,
      losses: 2,
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

// boardPickFields resolves kickoff + game id from the week slate.
const resolved = boardPickFields({ teamAbbr: "KC", source: "imported" }, [
  { id: "2026-w1-01", awayAbbr: "BAL", homeAbbr: "KC", kickoff: kcKickoff },
]);
assert.equal(resolved.pickTeamAbbr, "KC");
assert.equal(resolved.pickGameKickoff, kcKickoff);
assert.equal(resolved.pickGameId, "2026-w1-01");

console.log("verify-board-sort OK");

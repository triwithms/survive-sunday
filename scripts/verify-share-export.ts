/**
 * Board / Scores share-export helpers (no browser).
 *
 *   npx tsx scripts/verify-share-export.ts
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  alwaysIncludesFull,
  isComfortablyLong,
  isShareUrlAllowed,
  isTripleTap,
  recordTapTimes,
  shareCaption,
  shareFilename,
  shareImageHostAllowed,
  shareOptionsFor,
  slugWeekLabel,
  splitHeightsIntoPages,
  COMFORTABLE_SHARE_HEIGHT,
  SHARE_LONG_PRESS_MS,
  SHARE_OPEN_EVENT,
  type ShareOptionContext,
} from "../src/lib/share-export";
import {
  parseShareImageUrl,
  shareImageTypeAllowed,
} from "../src/lib/share-image-proxy";

function boardCtx(over: Partial<ShareOptionContext> = {}): ShareOptionContext {
  return {
    surface: "board",
    stillInCount: 8,
    undefeatedCount: 5,
    eliminatedCount: 3,
    gameCount: 0,
    liveGameCount: 0,
    pickRowCount: 11,
    tooLong: false,
    ...over,
  };
}

function scoresCtx(over: Partial<ShareOptionContext> = {}): ShareOptionContext {
  return {
    surface: "scores",
    stillInCount: 0,
    undefeatedCount: 0,
    eliminatedCount: 0,
    gameCount: 16,
    liveGameCount: 2,
    pickRowCount: 11,
    tooLong: false,
    ...over,
  };
}

const board = shareOptionsFor(boardCtx());
assert.ok(alwaysIncludesFull(board), "Board always lists full long picture");
assert.equal(board[0]?.id, "full");
assert.ok(!board.some((o) => o.id === "picks"));
assert.ok(board.some((o) => o.id === "still-in"));
assert.ok(board.some((o) => o.id === "undefeated"));
assert.ok(!board.some((o) => o.id === "pages"));
assert.ok(!board.some((o) => o.id === "games"));

const boardLong = shareOptionsFor(boardCtx({ tooLong: true }));
assert.ok(alwaysIncludesFull(boardLong));
assert.ok(boardLong.some((o) => o.id === "pages"));
assert.equal(boardLong[0]?.id, "full");

const boardNoUndefeated = shareOptionsFor(
  boardCtx({ undefeatedCount: 0, stillInCount: 2 })
);
assert.ok(!boardNoUndefeated.some((o) => o.id === "undefeated"));
assert.ok(boardNoUndefeated.some((o) => o.id === "still-in"));
assert.ok(alwaysIncludesFull(boardNoUndefeated));

const scores = shareOptionsFor(scoresCtx());
assert.ok(alwaysIncludesFull(scores));
assert.equal(scores[0]?.id, "full");
assert.ok(scores.some((o) => o.id === "games"));
assert.ok(scores.some((o) => o.id === "picks"));
assert.ok(scores.some((o) => o.id === "live"));
assert.ok(!scores.some((o) => o.id === "pages"));

const scoresQuiet = shareOptionsFor(
  scoresCtx({ liveGameCount: 0, tooLong: true })
);
assert.ok(!scoresQuiet.some((o) => o.id === "live"));
assert.ok(scoresQuiet.some((o) => o.id === "pages"));
assert.equal(scoresQuiet[0]?.id, "full");

assert.equal(slugWeekLabel("Week 1"), "week-1");
assert.equal(slugWeekLabel("  "), "week");
assert.equal(
  shareFilename({
    surface: "board",
    weekLabel: "Week 1",
    option: "full",
  }),
  "survive-sunday-board-week-1-full.png"
);
assert.equal(
  shareFilename({
    surface: "scores",
    weekLabel: "Week 1",
    option: "full",
    page: 2,
    pages: 3,
  }),
  "survive-sunday-scores-week-1-full-2-of-3.png"
);
assert.match(shareCaption("board", "Week 1", "full"), /Leaderboard/);
assert.match(shareCaption("scores", "Week 1", "games"), /scores/i);

assert.equal(isComfortablyLong(COMFORTABLE_SHARE_HEIGHT), false);
assert.equal(isComfortablyLong(COMFORTABLE_SHARE_HEIGHT + 1), true);

assert.deepEqual(splitHeightsIntoPages([100, 100, 100], 250), [
  [0, 1],
  [2],
]);
assert.deepEqual(splitHeightsIntoPages([300], 250), [[0]]);
assert.deepEqual(splitHeightsIntoPages([], 250), []);

assert.equal(shareImageHostAllowed("a.espncdn.com"), true);
assert.equal(shareImageHostAllowed("evil.example"), false);
assert.equal(
  isShareUrlAllowed("https://a.espncdn.com/i/teamlogos/nfl/500/kc.png"),
  true
);
assert.equal(isShareUrlAllowed("http://a.espncdn.com/kc.png"), false);
assert.equal(isShareUrlAllowed("https://evil.example/kc.png"), false);
assert.ok(
  parseShareImageUrl("https://a.espncdn.com/i/teamlogos/nfl/500/kc.png")
);
assert.equal(parseShareImageUrl("https://evil.example/x.png"), null);
assert.equal(shareImageTypeAllowed("image/png"), true);
assert.equal(shareImageTypeAllowed("text/html"), false);

function mustInclude(path: string, needles: string[]) {
  const src = readFileSync(path, "utf8");
  for (const needle of needles) {
    assert.ok(src.includes(needle), `${path} must include ${needle}`);
  }
}

mustInclude("src/components/features/board/BoardHeading.tsx", [
  "ShareExport",
]);
mustInclude("src/components/features/board/BoardScreen.tsx", [
  'data-share-root="board"',
  "share-board",
]);
mustInclude("src/components/features/scores/ScoresHeading.tsx", [
  "ShareExport",
]);
mustInclude("src/components/features/scores/ScoresScreen.tsx", [
  'data-share-root="scores"',
  "share-scores",
]);
mustInclude("src/components/ShareExport.tsx", [
  "SHARE_LONG_PRESS_MS",
  "share-export-week",
  "share-export-title",
]);
mustInclude("src/components/HeaderWeekBadge.tsx", [
  "SHARE_OPEN_EVENT",
  "isTripleTap",
]);
mustInclude("src/components/AppHeader.tsx", ['data-share-chrome=""']);
mustInclude("src/components/BottomNav.tsx", ['data-share-chrome=""']);
mustInclude("src/components/features/scores/GameDetailsHint.tsx", [
  "GameDetailsHint",
  'data-share-chrome=""',
]);
mustInclude("src/components/features/help/HelpScreens.tsx", [
  "Share Leaderboard &amp; Scores as a picture",
  "full long picture",
  "press and hold the page title",
  "tap the week label three times",
  'id="share-board-scores"',
]);
mustInclude("docs/HANDOFF.md", [
  "Share Leaderboard / Scores as a picture",
  "press and hold the page title",
  "full long picture",
]);

const boardPage = readFileSync("src/components/features/board/BoardScreen.tsx", "utf8");
const scoresPage = readFileSync("src/components/features/scores/ScoresScreen.tsx", "utf8");
assert.doesNotMatch(
  boardPage,
  />Share<\/|ShareExportButton/,
  "Board must not show a visible Share button"
);
assert.doesNotMatch(
  scoresPage,
  />Share<\/|ShareExportButton/,
  "Scores must not show a visible Share button"
);

assert.ok(SHARE_LONG_PRESS_MS >= 400);
assert.equal(SHARE_OPEN_EVENT, "ss-share-open");
assert.equal(isTripleTap(recordTapTimes([], 1000)), false);
assert.equal(
  isTripleTap(
    recordTapTimes(recordTapTimes(recordTapTimes([], 1000), 1100), 1200)
  ),
  true
);
assert.equal(
  isTripleTap(recordTapTimes(recordTapTimes([], 1000), 2000)),
  false
);

const helpFiles = [
  "src/components/HelpContent.tsx",
  ...readdirSync("src/components/features/help")
    .filter((name) => /\.(ts|tsx)$/.test(name))
    .map((name) => join("src/components/features/help", name)),
];
for (const path of helpFiles) {
  assert.doesNotMatch(
    readFileSync(path, "utf8"),
    /JaJa|sister|Gams for later|Commissioner/i,
    `${path} must not name JaJa / Commissioner`
  );
}

const pickSrc = readFileSync("src/app/api/picks/route.ts", "utf8");
assert.match(pickSrc, /export async function POST/);
assert.doesNotMatch(
  pickSrc,
  /share-export|html-to-image/,
  "Pick submit route must stay untouched"
);

console.log("verify-share-export: ok");

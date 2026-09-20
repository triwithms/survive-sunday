/**
 * Game sheet Share: /scores?week=&game= (Web Share or copy + “Link copied”).
 *
 *   npx tsx scripts/verify-matchup-share.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  PAGE_SHARE_COPIED,
  PAGE_SHARE_FAILED,
  shareCurrentPage,
} from "../src/lib/page-share";
import {
  MATCHUP_GAME_PARAM,
  matchupGameParam,
  matchupShareHref,
  matchupSharePath,
  matchupShareTitle,
  weekQueryForGame,
} from "../src/lib/matchup-share";

function src(path: string) {
  return readFileSync(path, "utf8");
}

function lineCount(path: string) {
  return src(path).split("\n").length;
}

assert.equal(MATCHUP_GAME_PARAM, "game");
assert.equal(matchupGameParam("2026-w2-07"), "2026-w2-07");
assert.equal(matchupGameParam([" 2026-w2-07 "]), "2026-w2-07");
assert.equal(matchupGameParam("  "), null);
assert.equal(matchupGameParam(undefined), null);

assert.equal(
  matchupSharePath("2026-w2-07", 2),
  "/scores?week=2&game=2026-w2-07"
);
assert.equal(
  matchupShareHref("https://survive-sunday.vercel.app/", "2026-w2-07", 2),
  "https://survive-sunday.vercel.app/scores?week=2&game=2026-w2-07"
);
assert.equal(
  matchupShareTitle("mia", "sf"),
  "Survive Sunday — MIA @ SF"
);

const weeks = [
  { number: 1, games: [{ id: "2026-w1-01" }] },
  { number: 2, games: [{ id: "2026-w2-07" }, { id: "2026-w2-08" }] },
];
assert.equal(weekQueryForGame(weeks, "2026-w2-07"), "2");
assert.equal(weekQueryForGame(weeks, "missing"), undefined);
assert.equal(weekQueryForGame(weeks, null), undefined);

async function main() {
  const nav = globalThis.navigator;
  const shared: ShareData[] = [];
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      share: async (data: ShareData) => {
        shared.push(data);
      },
      canShare: () => true,
    },
  });
  const url = matchupShareHref("https://example.com", "2026-w2-07", 2);
  assert.equal(
    await shareCurrentPage({ url, title: matchupShareTitle("MIA", "SF") }),
    "shared"
  );
  assert.equal(shared[0]?.url, url);
  assert.match(String(shared[0]?.title), /MIA @ SF/);

  let copied = "";
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      clipboard: {
        writeText: async (text: string) => {
          copied = text;
        },
      },
    },
  });
  assert.equal(await shareCurrentPage({ url, title: "x" }), "copied");
  assert.equal(copied, url);
  assert.equal(PAGE_SHARE_COPIED, "Link copied");
  assert.equal(PAGE_SHARE_FAILED, "Couldn’t copy — try again");

  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: nav,
  });
}

const files = [
  "src/lib/matchup-share.ts",
  "src/components/ScoreGameShareButton.tsx",
  "src/components/ScoreGameSheetBar.tsx",
  "src/components/HeaderShareButton.tsx",
  "src/components/ShareLinkButton.tsx",
  "src/components/ShareLinkPanel.tsx",
  "src/components/features/schedule/ScheduleDetailsButton.tsx",
  "src/components/features/schedule/ScheduleGameRow.tsx",
];
for (const file of files) {
  const n = lineCount(file);
  assert.ok(n <= 100, `${file} is ${n} lines (max 100)`);
}

const bar = src("src/components/ScoreGameSheetBar.tsx");
assert.match(bar, /ScoreGameShareButton/);
assert.match(bar, />\s*Close\s*</);
const sheet = src("src/components/ScoreGameDetailSheet.tsx");
assert.match(sheet, /ScoreGameSheetBar/);
assert.match(sheet, /weekNumber/);
const shareBtn = src("src/components/ScoreGameShareButton.tsx");
assert.match(shareBtn, /ShareLinkButton/);
assert.match(shareBtn, /testId="game-sheet-share"/);
assert.match(shareBtn, /min-h-11 min-w-11/);
assert.match(shareBtn, /matchupShareHref/);
assert.doesNotMatch(shareBtn, /Share2/);
const panel = src("src/components/ShareLinkPanel.tsx");
assert.match(panel, /data-testid="share-link-url"/);
assert.match(panel, />\s*Copy\s*</);
assert.match(panel, /z-\[120\]/);
const header = src("src/components/HeaderShareButton.tsx");
assert.match(header, /window\.location\.href/);
assert.match(header, /testId="header-share"/);
const schedule = src("src/components/features/schedule/ScheduleGameRow.tsx");
assert.match(schedule, /ScheduleDetailsButton/);
assert.match(schedule, /ScoreGameDetailSheet/);
assert.match(schedule, /href=\{`\/team\/\$\{game\.awayAbbr\}`\}/);
assert.doesNotMatch(schedule, /role="button"/);
const details = src("src/components/features/schedule/ScheduleDetailsButton.tsx");
assert.match(details, />\s*Details\s*</);
assert.match(details, /min-h-11/);
assert.match(details, /text-gold-400/);
const scoresLoad = src("src/components/features/scores/load-scores.ts");
assert.match(scoresLoad, /openGameId/);
assert.match(scoresLoad, /matchupGameParam/);
const schedLoad = src("src/components/features/schedule/load-schedule.ts");
assert.match(schedLoad, /openGameId/);

void main()
  .then(() => {
    console.log("verify-matchup-share: ok");
  })
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });

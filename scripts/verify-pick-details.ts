/**
 * My pick game Game details › reuses the Scores sheet (no database).
 *
 *   npx tsx scripts/verify-pick-details.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  pickDetailsAria,
  pickSheetGame,
} from "../src/components/features/pick/pick-sheet-game";
import type { PickMatchup, PickSide } from "../src/components/features/pick/types";

function src(path: string) {
  return readFileSync(path, "utf8");
}

function side(abbr: string, extra: Partial<PickSide> = {}): PickSide {
  return {
    abbr,
    name: abbr,
    logoUrl: `/${abbr}.png`,
    alreadyUsed: false,
    priorYearRank: null,
    standing: null,
    ...extra,
  };
}

function matchup(extra: Partial<PickMatchup> = {}): PickMatchup {
  return {
    id: "game-mia-sf",
    kickoff: "2026-09-20T20:25:00.000Z",
    status: "scheduled",
    scoreAway: null,
    scoreHome: null,
    note: null,
    spreadHome: -3,
    spreadAway: 3,
    mlHome: -150,
    mlAway: 130,
    away: side("MIA", { name: "Miami Dolphins" }),
    home: side("SF", { name: "San Francisco 49ers" }),
    ...extra,
  };
}

const mapped = pickSheetGame(matchup());
assert.ok(mapped);
assert.equal(mapped.id, "game-mia-sf");
assert.equal(mapped.awayAbbr, "MIA");
assert.equal(mapped.homeAbbr, "SF");
assert.equal(mapped.awayLogoUrl, "/MIA.png");
assert.equal(mapped.homeLogoUrl, "/SF.png");
assert.equal(mapped.network, null);
assert.equal(mapped.kickoff, "2026-09-20T20:25:00.000Z");
console.log("PASS  pickSheetGame maps the Scores sheet payload");

assert.equal(pickSheetGame(matchup({ id: "  " })), null);
assert.equal(pickSheetGame(matchup({ away: side("") })), null);
assert.equal(pickSheetGame(matchup({ home: side("  ") })), null);
assert.equal(pickSheetGame(null), null);
console.log("PASS  pickSheetGame hides when the matchup cannot be resolved");

const aria = pickDetailsAria(matchup());
assert.match(aria, /Game details/);
assert.match(aria, /MIA at SF/);
console.log("PASS  details aria names the matchup, not a single team");

const files = [
  "src/components/features/pick/PickMatchupCard.tsx",
  "src/components/features/pick/PickSideButton.tsx",
  "src/components/features/pick/PickGameDetailsButton.tsx",
  "src/components/features/pick/pick-sheet-game.ts",
  "src/components/features/pick/PickScreen.tsx",
  "src/components/features/help/HelpPick.tsx",
];
for (const file of files) {
  const lines = src(file).split("\n").length;
  assert.ok(lines <= 100, `${file} is ${lines} lines (max 100)`);
}

const card = src("src/components/features/pick/PickMatchupCard.tsx");
assert.match(card, /ScoreGameDetailSheet/);
assert.match(card, /pickSheetGame/);
assert.match(card, /PickGameDetailsButton/);
assert.match(card, /weekNumber=\{weekNumber\}/);
assert.doesNotMatch(card, /onDetails=/);
assert.doesNotMatch(card, /role="button"/);
assert.doesNotMatch(card, /Open game details/);
console.log("PASS  matchup card reuses Scores sheet; row is not the Details hit target");

const sideBtn = src("src/components/features/pick/PickSideButton.tsx");
assert.doesNotMatch(sideBtn, /PickGameDetailsButton/);
assert.doesNotMatch(sideBtn, /onDetails/);
assert.match(sideBtn, /aria-label=\{`Pick \$\{side\.name\}/);
assert.doesNotMatch(sideBtn, /href=\{`\/team\//);
console.log("PASS  Pick stays primary; Game details is not on each team");

const detailsBtn = src("src/components/features/pick/PickGameDetailsButton.tsx");
assert.match(detailsBtn, /data-testid="pick-game-details"/);
assert.match(detailsBtn, />\s*Game details\s*</);
assert.match(detailsBtn, /ChevronRight/);
assert.match(detailsBtn, /stopPropagation/);
assert.match(detailsBtn, /min-h-11/);
assert.match(detailsBtn, /uppercase/);
assert.match(detailsBtn, /text-gold-400/);
assert.match(detailsBtn, /justify-center/);
console.log("PASS  Game details › is centred and tappable");

const help = src("src/components/features/help/HelpPick.tsx");
assert.match(help, /Game details/);
assert.match(help, /middle of a matchup/);
assert.match(help, /preview before kickoff/);
assert.match(help, /Close to stay on My pick/);
console.log("PASS  Help mentions Game details on My pick");

console.log("verify-pick-details OK");

/**
 * Odds sanitizer + ESPN pickcenter parse (no database).
 *
 *   npx tsx scripts/verify-odds.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { PICKEM_LABEL, resolveFavourite } from "../src/lib/matchup-meta";
import {
  formatSignedSpread,
  formatSpreadOrDash,
  formatSpreadPoints,
  isPlaceholderOdds,
  lookupSeedOdds,
  parseEspnCompetitionOdds,
  parseEspnOddsDetails,
  parseEspnPickcenter,
  parseEspnSummaryOdds,
  parseSignedNumber,
  PLACEHOLDER_ODDS,
  resolveSeedOdds,
  sanitizeGameOdds,
  type SeedOddsInput,
} from "../src/lib/odds";
import { loadNormalizedSeason } from "../src/lib/season-schedule";

assert.equal(isPlaceholderOdds(PLACEHOLDER_ODDS), true);
assert.equal(
  isPlaceholderOdds({
    spreadHome: -3,
    spreadAway: 3,
    mlHome: -170,
    mlAway: 142,
  }),
  false,
  "real SEA -3 closing line is not the seed placeholder"
);
assert.deepEqual(sanitizeGameOdds(PLACEHOLDER_ODDS), {
  spreadHome: null,
  spreadAway: null,
  mlHome: null,
  mlAway: null,
});
assert.equal(
  resolveFavourite({
    homeAbbr: "SEA",
    awayAbbr: "NE",
    ...PLACEHOLDER_ODDS,
  }),
  null,
  "placeholder must not render a fake SEA favoured-by line"
);

const missing = resolveSeedOdds(undefined);
assert.equal(missing.spreadHome, null);
assert.equal(missing.spreadAway, null);
assert.equal(missing.mlHome, null);
assert.equal(missing.mlAway, null);

const fromFile = resolveSeedOdds({
  away: "BUF",
  home: "HOU",
  spread: { home: 1.5, away: -1.5 },
  moneyline: { home: 105, away: -125 },
});
assert.equal(fromFile.spreadHome, 1.5);
assert.equal(fromFile.spreadAway, -1.5);
assert.equal(fromFile.mlHome, 105);
assert.equal(fromFile.mlAway, -125);

assert.equal(parseSignedNumber("-4.5"), -4.5);
assert.equal(parseSignedNumber("+4.5"), 4.5);
assert.equal(parseSignedNumber("PK"), 0);
assert.equal(formatSignedSpread(-4.5), "-4.5");
assert.equal(formatSignedSpread(-3), "-3");
assert.equal(formatSignedSpread(3.5), "+3.5");
assert.equal(formatSignedSpread(0), "PK");
assert.equal(formatSpreadPoints(-4.5), "4.5");
assert.equal(formatSpreadPoints(3), "3");
assert.equal(formatSpreadOrDash(null), "—");

assert.deepEqual(
  sanitizeGameOdds({
    spreadHome: "-4.5",
    spreadAway: "4.5",
    mlHome: "-218",
    mlAway: "180",
  } as never),
  { spreadHome: -4.5, spreadAway: 4.5, mlHome: -218, mlAway: 180 },
  "Prisma/JSON string numbers must still show as a favourite"
);

const fromDetails = parseEspnOddsDetails("BUF -4.5", "BUF", "DET");
assert.deepEqual(fromDetails, { spreadHome: -4.5, spreadAway: 4.5 });
assert.deepEqual(parseEspnOddsDetails("CAR -2.5", "ATL", "CAR"), {
  spreadHome: 2.5,
  spreadAway: -2.5,
});
assert.deepEqual(parseEspnOddsDetails("WSH -3.5", "WAS", "NYG"), {
  spreadHome: -3.5,
  spreadAway: 3.5,
});

const scoreboardBuf = parseEspnCompetitionOdds(
  [
    {
      details: "BUF -4.5",
      spread: -4.5,
      homeTeamOdds: { favorite: true },
      awayTeamOdds: { favorite: false },
      pointSpread: {
        home: { close: { line: "-4.5" }, open: { line: "-3" } },
        away: { close: { line: "+4.5" } },
      },
      moneyline: {
        home: { close: { odds: "-218" } },
        away: { close: { odds: "+180" } },
      },
    },
  ],
  "BUF",
  "DET"
);
assert.ok(scoreboardBuf);
assert.equal(scoreboardBuf!.spreadHome, -4.5);
assert.equal(scoreboardBuf!.spreadAway, 4.5);
assert.equal(scoreboardBuf!.mlHome, -218);
assert.equal(scoreboardBuf!.mlAway, 180);
assert.equal(
  resolveFavourite({
    homeAbbr: "BUF",
    awayAbbr: "DET",
    ...scoreboardBuf!,
  })?.label,
  "BUF favoured by 4.5"
);

const scoreboardCar = parseEspnCompetitionOdds(
  [
    {
      details: "CAR -2.5",
      spread: 2.5,
      homeTeamOdds: { favorite: false },
      awayTeamOdds: { favorite: true },
    },
  ],
  "ATL",
  "CAR"
);
assert.ok(scoreboardCar);
assert.equal(scoreboardCar!.spreadAway, -2.5);
assert.equal(scoreboardCar!.spreadHome, 2.5);
assert.equal(
  resolveFavourite({
    homeAbbr: "ATL",
    awayAbbr: "CAR",
    ...scoreboardCar!,
  })?.label,
  "CAR favoured by 2.5"
);

assert.equal(parseEspnCompetitionOdds(undefined, "BUF", "DET"), null);
assert.equal(
  parseEspnCompetitionOdds([{ details: "??" }], "BUF", "DET"),
  null
);

const bufAtDet = parseEspnPickcenter([
  {
    details: "BUF -4.5",
    spread: -4.5,
    homeTeamOdds: { favorite: true, moneyLine: -218 },
    awayTeamOdds: { favorite: false, moneyLine: 180 },
    pointSpread: {
      home: { close: { line: "-4.5" } },
      away: { close: { line: "+4.5" } },
    },
  },
]);
assert.ok(bufAtDet);
assert.equal(bufAtDet!.spreadHome, -4.5);
assert.equal(bufAtDet!.spreadAway, 4.5);
assert.equal(bufAtDet!.mlHome, -218);
assert.equal(bufAtDet!.mlAway, 180);

const favBuf = resolveFavourite({
  homeAbbr: "BUF",
  awayAbbr: "DET",
  ...bufAtDet!,
});
assert.equal(favBuf?.abbr, "BUF");
assert.equal(favBuf?.line, "BUF -4.5");
assert.equal(favBuf?.label, "BUF favoured by 4.5");

const seaClose = parseEspnSummaryOdds({
  pickcenter: [
    {
      details: "SEA -3",
      spread: -3,
      homeTeamOdds: { favorite: true, moneyLine: -170 },
      awayTeamOdds: { favorite: false, moneyLine: 142 },
      pointSpread: {
        home: { close: { line: "-3" } },
        away: { close: { line: "+3" } },
      },
    },
  ],
});
assert.ok(seaClose);
assert.equal(seaClose!.spreadHome, -3);
assert.equal(isPlaceholderOdds(seaClose), false);
const favSea = resolveFavourite({
  homeAbbr: "SEA",
  awayAbbr: "NE",
  ...seaClose!,
});
assert.equal(favSea?.label, "SEA favoured by 3");

const season = loadNormalizedSeason();
const week1 = season.find((w) => w.week === 1);
const week2 = season.find((w) => w.week === 2);
assert.ok(week1 && week1.games.length >= 16, "week 1 slate");
assert.ok(week2 && week2.games.length >= 16, "week 2 slate");

const dataDir = path.resolve(process.cwd(), "data");
const week1Odds = JSON.parse(
  readFileSync(path.join(dataDir, "week1-games.json"), "utf8")
) as { games: SeedOddsInput[] };
const week2Odds = JSON.parse(
  readFileSync(path.join(dataDir, "week2-odds.json"), "utf8")
) as { games: SeedOddsInput[] };

function linesForWeek(games: { awayAbbr: string; homeAbbr: string }[], odds: SeedOddsInput[]) {
  return games.map((g) => lookupSeedOdds(odds, g.awayAbbr, g.homeAbbr));
}

const w1 = linesForWeek(week1!.games, week1Odds.games);
const w2 = linesForWeek(week2!.games, week2Odds.games);
assert.equal(
  w1.filter((o) => isPlaceholderOdds(o)).length,
  0,
  "week 1 seed lookup must not stamp fake -3"
);
assert.equal(
  w2.filter((o) => isPlaceholderOdds(o)).length,
  0,
  "week 2 seed lookup must not stamp fake -3"
);

const w1Favs = week1!.games.map((g, i) =>
  resolveFavourite({
    homeAbbr: g.homeAbbr,
    awayAbbr: g.awayAbbr,
    ...w1[i],
  })
);
const fakeMinus3 = w1Favs.filter((f) => f?.label.endsWith(" favoured by 3"));
assert.ok(
  fakeMinus3.length < week1!.games.length,
  `week 1 must not show -3 on every favourite (got ${fakeMinus3.length}/${week1!.games.length})`
);

const w2WithFileOdds = w2.filter((o) => o.spreadHome != null);
assert.ok(
  w2WithFileOdds.length < week2!.games.length,
  "stale week2-odds.json should not match every official 2026 pairing — missing games stay blank, not -3"
);

const awayFav = parseEspnPickcenter([
  {
    details: "KC -2.5",
    spread: -2.5,
    homeTeamOdds: { favorite: false, moneyLine: 120 },
    awayTeamOdds: { favorite: true, moneyLine: -140 },
  },
]);
assert.equal(awayFav?.spreadAway, -2.5);
assert.equal(awayFav?.spreadHome, 2.5);
assert.equal(
  resolveFavourite({
    homeAbbr: "PHI",
    awayAbbr: "KC",
    ...awayFav!,
  })?.abbr,
  "KC"
);

const balAtInd = parseEspnPickcenter([
  {
    details: "BAL -3",
    spread: 3,
    homeTeamOdds: { favorite: false, moneyLine: 130 },
    awayTeamOdds: { favorite: true, moneyLine: -155 },
    pointSpread: {
      home: { close: { line: "+3" } },
      away: { close: { line: "-3" } },
    },
  },
]);
assert.equal(balAtInd?.spreadHome, 3);
assert.equal(balAtInd?.spreadAway, -3);
assert.equal(
  resolveFavourite({
    homeAbbr: "IND",
    awayAbbr: "BAL",
    ...balAtInd!,
  })?.label,
  "BAL favoured by 3"
);

assert.equal(
  resolveFavourite({
    homeAbbr: "NYG",
    awayAbbr: "DAL",
    spreadHome: 0,
    spreadAway: 0,
    mlHome: -110,
    mlAway: -110,
  })?.label,
  "Even (pick'em)",
  "a real ESPN pick'em shows even, not a minus spread"
);

const pickem = resolveFavourite({
  homeAbbr: "NYJ",
  awayAbbr: "NYG",
  spreadHome: 0,
  spreadAway: 0,
});
assert.equal(pickem?.label, PICKEM_LABEL);
assert.equal(pickem?.abbr, null);
assert.equal(pickem?.line, "PK");

const pickemAwayOnly = resolveFavourite({
  homeAbbr: "NYJ",
  awayAbbr: "NYG",
  spreadHome: null,
  spreadAway: 0,
});
assert.equal(pickemAwayOnly?.label, PICKEM_LABEL);

assert.equal(
  resolveFavourite({
    homeAbbr: "NYJ",
    awayAbbr: "NYG",
    spreadHome: null,
    spreadAway: null,
  }),
  null,
  "missing ESPN line stays hidden — never invent a favourite or pick'em"
);

console.log("verify-odds OK");

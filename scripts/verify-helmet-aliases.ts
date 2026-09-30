/**
 * Every app team abbr, alias, and team name resolves to a committed
 * `public/helmets/{abbr}.png` (LAR and LA → lar.png, WSH → was.png, …).
 *
 *   npm run verify:helmet-aliases
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ESPN_TEAM_IDS, espnTeamLogoUrl, normAbbr } from "../src/lib/espn-teams";
import { parseEspnScoreboard } from "../src/lib/espn-scoreboard-parse";
import { NFL_TEAM_META } from "../src/lib/nfl-team-meta";
import { parseEspnOddsDetails } from "../src/lib/odds";
import { normalizeAbbr } from "../src/lib/season-schedule";
import {
  APP_TEAM_ABBRS,
  canonicalTeamAbbr,
  TEAM_ABBR_ALIASES,
} from "../src/lib/team-abbr";
import {
  knownHelmetSrc,
  localHelmetSrc,
  resolveTeamLogoSrc,
  TEAM_HELMET_PLACEHOLDER,
} from "../src/lib/team-helmets";

const root = process.cwd();
const helmetsDir = path.join(root, "public/helmets");

const EXPECTED =
  "ari atl bal buf car chi cin cle dal den det gb hou ind jax kc lac lar lv mia min ne no nyg nyj phi pit sea sf tb ten was".split(
    " "
  );

assert.deepEqual(
  APP_TEAM_ABBRS.map((a) => a.toLowerCase()),
  EXPECTED,
  "APP_TEAM_ABBRS is the 32 app abbrs"
);
assert.deepEqual(
  [...APP_TEAM_ABBRS].sort(),
  Object.keys(ESPN_TEAM_IDS).sort(),
  "APP_TEAM_ABBRS matches ESPN_TEAM_IDS"
);
assert.deepEqual(
  [...APP_TEAM_ABBRS].sort(),
  Object.keys(NFL_TEAM_META).sort(),
  "APP_TEAM_ABBRS matches NFL_TEAM_META"
);

const pngs = fs
  .readdirSync(helmetsDir)
  .filter((f) => f.endsWith(".png"))
  .sort();
assert.deepEqual(
  pngs,
  EXPECTED.map((a) => `${a}.png`).sort(),
  "public/helmets has exactly one lowercase PNG per app abbr"
);
assert.ok(
  fs.existsSync(path.join(root, "public", TEAM_HELMET_PLACEHOLDER)),
  "placeholder exists"
);

function helmetFileFor(src: string): string {
  assert.match(src, /^\/helmets\/[a-z]{2,3}\.png$/, `${src} is a lowercase local PNG`);
  return path.join(root, "public", src);
}

/** Input must land on `/helmets/{expected}.png` via every entry point. */
function expectHelmet(input: string, expected: string): void {
  const want = `/helmets/${expected}.png`;
  for (const variant of [input, input.toLowerCase(), input.toUpperCase(), `  ${input} `]) {
    assert.equal(localHelmetSrc(variant), want, `localHelmetSrc(${JSON.stringify(variant)})`);
    assert.equal(knownHelmetSrc(variant), want, `knownHelmetSrc(${JSON.stringify(variant)})`);
    assert.equal(
      resolveTeamLogoSrc(variant, espnTeamLogoUrl(expected), null),
      want,
      `resolveTeamLogoSrc(${JSON.stringify(variant)})`
    );
    assert.equal(
      resolveTeamLogoSrc(variant, null, want),
      TEAM_HELMET_PLACEHOLDER,
      `${JSON.stringify(variant)} falls back to placeholder after 404`
    );
  }
  assert.ok(fs.existsSync(helmetFileFor(want)), `${input} → ${want} exists`);
}

let checked = 0;
for (const abbr of APP_TEAM_ABBRS) {
  expectHelmet(abbr, abbr.toLowerCase());
  expectHelmet(`/helmets/${abbr}.png`, abbr.toLowerCase());
  assert.equal(normAbbr(abbr), abbr);
  checked += 2;
}

for (const [alias, abbr] of Object.entries(TEAM_ABBR_ALIASES)) {
  assert.ok(
    (APP_TEAM_ABBRS as readonly string[]).includes(abbr),
    `alias ${alias} → ${abbr} is an app abbr`
  );
  assert.equal(
    (APP_TEAM_ABBRS as readonly string[]).includes(alias),
    false,
    `alias ${alias} is not itself an app abbr`
  );
  expectHelmet(alias, abbr.toLowerCase());
  assert.equal(normAbbr(alias), abbr, `normAbbr(${alias})`);
  assert.equal(normalizeAbbr(alias), abbr, `normalizeAbbr(${alias})`);
  checked++;
}

for (const t of Object.values(NFL_TEAM_META)) {
  const slug = t.name.toLowerCase().replace(/\s+/g, "-");
  for (const name of [t.name, t.nickname, slug, ...t.aliases]) {
    expectHelmet(name, t.abbr.toLowerCase());
    checked++;
  }
}

const teamsJson = JSON.parse(
  fs.readFileSync(path.join(root, "data/teams.json"), "utf8")
) as { id: string; abbreviation: string }[];
assert.equal(teamsJson.length, 32);
for (const t of teamsJson) {
  const abbr = canonicalTeamAbbr(t.abbreviation);
  assert.ok(abbr, `data/teams.json ${t.abbreviation} is known`);
  expectHelmet(t.abbreviation, abbr.toLowerCase());
  expectHelmet(t.id, abbr.toLowerCase());
  checked += 2;
}

expectHelmet("LAR", "lar");
expectHelmet("LA", "lar");
expectHelmet("la", "lar");
expectHelmet("Rams", "lar");
expectHelmet("Los Angeles Rams", "lar");
expectHelmet("los-angeles-rams", "lar");
expectHelmet("WSH", "was");
expectHelmet("JAC", "jax");
expectHelmet("LAC", "lac");
assert.equal(normAbbr("LA"), "LAR");
assert.equal(normalizeAbbr("LA"), "LAR");

assert.deepEqual(parseEspnOddsDetails("LA -3.5", "LAR", "SF"), {
  spreadHome: -3.5,
  spreadAway: 3.5,
});
assert.deepEqual(parseEspnOddsDetails("WSH -1.5", "WAS", "NYG"), {
  spreadHome: -1.5,
  spreadAway: 1.5,
});

const [snap] = parseEspnScoreboard({
  events: [
    {
      id: "1",
      competitions: [
        {
          competitors: [
            { homeAway: "away", team: { abbreviation: "SF" }, score: "7" },
            { homeAway: "home", team: { abbreviation: "LA" }, score: "27" },
          ],
          status: { type: { state: "post", name: "STATUS_FINAL" } },
        },
      ],
    },
  ],
} as Parameters<typeof parseEspnScoreboard>[0]);
assert.equal(snap?.homeAbbr, "LAR", "ESPN scoreboard LA → LAR");
expectHelmet(snap!.homeAbbr, "lar");

for (const unknown of ["", "   ", "TBD", "XYZ", "Los Angeles", "New York", "nfl"]) {
  assert.equal(knownHelmetSrc(unknown), null, `${JSON.stringify(unknown)} has no helmet`);
  assert.equal(
    resolveTeamLogoSrc(unknown, null, null),
    TEAM_HELMET_PLACEHOLDER,
    `${JSON.stringify(unknown)} → placeholder, never blank`
  );
}
assert.equal(resolveTeamLogoSrc(null, null, null), TEAM_HELMET_PLACEHOLDER);
assert.equal(resolveTeamLogoSrc(undefined, null, null), TEAM_HELMET_PLACEHOLDER);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(full);
  }
  return out;
}
const aliasMaps = walk(path.join(root, "src"))
  .filter((file) => {
    const src = fs.readFileSync(file, "utf8");
    return /\bLA:\s*"LAR"|===\s*"LA"|"WSH"\s*\?\s*"WAS"|===\s*"WSH"/.test(src);
  })
  .map((f) => path.relative(root, f));
assert.deepEqual(aliasMaps, ["src/lib/team-abbr.ts"], "one team alias map");

const teamLogoSrc = fs.readFileSync(path.join(root, "src/components/TeamLogo.tsx"), "utf8");
assert.match(teamLogoSrc, /resolveTeamLogoSrc\(abbr/);
assert.match(teamLogoSrc, /naturalWidth === 0/, "catches pre-hydration 404s");
assert.match(teamLogoSrc, /onError/);

const readme = fs.readFileSync(path.join(helmetsDir, "README.md"), "utf8");
assert.match(readme, /src\/lib\/team-abbr\.ts/, "README names the alias map");

console.log(`verify-helmet-aliases: ok (${checked} inputs → 32 local helmets)`);

/**
 * Every NFL club and every known alias resolves to a committed local helmet.
 *
 *   npx tsx scripts/verify-helmet-aliases.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ESPN_TEAM_IDS, espnTeamLogoUrl, normAbbr } from "../src/lib/espn-teams";
import { NFL_TEAM_META } from "../src/lib/nfl-team-meta";
import { normalizeAbbr } from "../src/lib/season-schedule";
import {
  canonicalTeamAbbr,
  isTeamAbbr,
  TEAM_ABBR_ALIASES,
  TEAM_HELMET_FILES,
  type TeamAbbr,
} from "../src/lib/team-abbr";
import {
  helmetFileFor,
  helmetSrcCandidates,
  localHelmetSrc,
  resolveTeamLogoSrc,
  TEAM_HELMET_PLACEHOLDER,
} from "../src/lib/team-helmets";

const root = process.cwd();
const helmetDir = path.join(root, "public/helmets");

function publicFile(src: string): string {
  return path.join(root, "public", src.replace(/^\//, ""));
}

function assertPng(src: string, label: string): void {
  const file = publicFile(src);
  assert.ok(fs.existsSync(file), `${label}: ${src} exists`);
  const bytes = fs.readFileSync(file);
  assert.ok(bytes.length > 1000, `${label}: ${src} has bytes`);
  assert.equal(bytes.readUInt32BE(0), 0x89504e47, `${label}: ${src} is a PNG`);
}

// --- The map is exactly the 32 clubs, and matches every other team list.
const canon = Object.keys(TEAM_HELMET_FILES).sort() as TeamAbbr[];
assert.equal(canon.length, 32, "32 clubs in TEAM_HELMET_FILES");
assert.deepEqual(Object.keys(ESPN_TEAM_IDS).sort(), canon, "ESPN_TEAM_IDS keys");
assert.deepEqual(Object.keys(NFL_TEAM_META).sort(), canon, "NFL_TEAM_META keys");

const pngs = fs
  .readdirSync(helmetDir)
  .filter((f) => f.endsWith(".png"))
  .sort();
assert.deepEqual(
  pngs,
  canon.map((a) => `${TEAM_HELMET_FILES[a]}.png`).sort(),
  "public/helmets has exactly one PNG per mapped club (no orphans, no gaps)"
);
assert.ok(fs.existsSync(publicFile(TEAM_HELMET_PLACEHOLDER)), "placeholder exists");
for (const f of fs.readdirSync(helmetDir).filter((n) => n !== "README.md")) {
  assert.equal(f, f.toLowerCase(), `${f} is lowercase (Vercel is case-sensitive)`);
}

// --- Aliases point at real clubs and never shadow one.
for (const [alias, target] of Object.entries(TEAM_ABBR_ALIASES)) {
  assert.equal(alias, alias.toUpperCase(), `${alias} alias key is uppercase`);
  assert.ok(isTeamAbbr(target), `${alias} → ${target} is a club`);
  assert.equal(isTeamAbbr(alias), false, `${alias} is not itself a club abbr`);
}
for (const [alias, target] of [
  ["WSH", "WAS"],
  ["WFT", "WAS"],
  ["LA", "LAR"],
  ["STL", "LAR"],
  ["JAC", "JAX"],
  ["SD", "LAC"],
  ["OAK", "LV"],
  ["LVR", "LV"],
] as const) {
  assert.equal(TEAM_ABBR_ALIASES[alias], target, `${alias} → ${target}`);
}
// Blockers blank `/helmets/ne.png`; NE must stay on a longer stem.
assert.equal(TEAM_HELMET_FILES.NE, "nwe", "NE helmet file is nwe.png");
assert.equal(localHelmetSrc("NE"), "/helmets/nwe.png");
assert.equal(localHelmetSrc("NWE"), "/helmets/nwe.png");
assert.equal(fs.existsSync(path.join(helmetDir, "ne.png")), false, "no blocker-prone ne.png");

// --- Every spelling × casing × wrapper resolves to the mapped, existing PNG.
function variants(s: string): string[] {
  const lower = s.toLowerCase();
  const mixed = s[0] + lower.slice(1);
  return [s, lower, mixed, ` ${s} `, `\t${lower}\n`, `${s}.png`, `${lower}.PNG`, `/helmets/${s}.png`];
}
const spellings: [string, TeamAbbr][] = [
  ...canon.map((a) => [a, a] as [string, TeamAbbr]),
  ...Object.entries(TEAM_ABBR_ALIASES),
];
let checked = 0;
for (const [spelling, club] of spellings) {
  const want = `/helmets/${TEAM_HELMET_FILES[club]}.png`;
  assertPng(want, club);
  for (const v of variants(spelling)) {
    const label = `${JSON.stringify(v)} (${club})`;
    assert.equal(helmetFileFor(v), TEAM_HELMET_FILES[club], `${label} file`);
    assert.equal(localHelmetSrc(v), want, `${label} localHelmetSrc`);
    assert.equal(resolveTeamLogoSrc(v, null, null), want, `${label} resolve`);
    assert.equal(
      resolveTeamLogoSrc(v, espnTeamLogoUrl(club), null),
      want,
      `${label} ignores stored CDN url`
    );
    for (const src of helmetSrcCandidates(v)) {
      assert.match(src, /^\/helmets\/[a-z0-9]{1,5}\.png$/, `${label} candidate ${src}`);
    }
    checked++;
  }
  assert.equal(canonicalTeamAbbr(spelling), club, `${spelling} canonical`);
  assert.equal(normAbbr(spelling.toLowerCase()), club, `${spelling} normAbbr`);
  assert.equal(normalizeAbbr(` ${spelling} `), club, `${spelling} season normalizeAbbr`);
}

// --- Fallback chain: mapped PNG → alias's own file name → placeholder. Never remote, never blank.
assert.deepEqual(helmetSrcCandidates("LA"), ["/helmets/lar.png", "/helmets/la.png"]);
assert.deepEqual(helmetSrcCandidates("LAR"), ["/helmets/lar.png"]);
assert.equal(resolveTeamLogoSrc("LA", null, ["/helmets/lar.png"]), "/helmets/la.png");
assert.equal(
  resolveTeamLogoSrc("LA", null, ["/helmets/lar.png", "/helmets/la.png"]),
  TEAM_HELMET_PLACEHOLDER
);
assert.equal(resolveTeamLogoSrc("LAR", null, "/helmets/lar.png"), TEAM_HELMET_PLACEHOLDER);
for (const junk of ["", "   ", "/helmets/.png", "L A", "<svg>", "../../etc", "TOOLONGX"]) {
  const src = resolveTeamLogoSrc(junk, null, null);
  assert.ok(src.length > 0, `${JSON.stringify(junk)} never blank`);
  assert.doesNotMatch(src, /^https?:/i, `${JSON.stringify(junk)} never remote`);
  assert.ok(
    src === TEAM_HELMET_PLACEHOLDER || /^\/helmets\/[a-z0-9]{1,5}\.png$/.test(src),
    `${JSON.stringify(junk)} → ${src} is a safe local path`
  );
}
assert.equal(localHelmetSrc(""), TEAM_HELMET_PLACEHOLDER);

// --- Every team abbreviation stored in data/*.json resolves to a club.
const ABBR_KEY = /^(abbr|abbreviation|team_abbreviation|away|home|awayAbbr|homeAbbr|team|teamAbbr)$/;
function walk(node: unknown, out: string[]): void {
  if (Array.isArray(node)) node.forEach((n) => walk(n, out));
  else if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      if (ABBR_KEY.test(k) && typeof v === "string" && /^[A-Za-z]{2,3}$/.test(v)) out.push(v);
      else walk(v, out);
    }
  }
}
for (const name of [
  "teams.json",
  "team_profiles.json",
  "team_rosters.json",
  "team_coaches.json",
  "power_rankings.json",
  "season-2026-schedule.json",
  "week1-games.json",
  "week2-odds.json",
  "week2-standings.json",
]) {
  const found: string[] = [];
  walk(JSON.parse(fs.readFileSync(path.join(root, "data", name), "utf8")), found);
  assert.ok(found.length > 0, `${name} has team abbreviations`);
  for (const raw of new Set(found)) {
    assert.ok(isTeamAbbr(normAbbr(raw)), `${name}: ${raw} normalizes to a club`);
    assertPng(localHelmetSrc(raw), `${name}: ${raw}`);
  }
}

// --- One alias table, one helmet path builder, one logo <img>.
function walkSrc(dir: string, out: string[] = []): string[] {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walkSrc(full, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(full);
  }
  return out;
}
const rel = (f: string) => path.relative(root, f);
/** App UI goes through TeamLogo; email HTML can't run React so it builds its own <img>. */
const LOGO_IMG_RENDERERS = ["src/components/TeamLogo.tsx", "src/lib/week-wrap-html-util.ts"];
for (const file of walkSrc(path.join(root, "src"))) {
  const src = fs.readFileSync(file, "utf8");
  if (rel(file) !== "src/lib/team-abbr.ts") {
    assert.doesNotMatch(src, /===\s*["'](WSH|WFT|JAC|LA)["']/, `${rel(file)} has an inline alias check`);
    assert.doesNotMatch(src, /\b(WSH|JAC|WFT)\s*:\s*["'][A-Z]{2,3}["']/, `${rel(file)} has its own alias table`);
  }
  if (rel(file) !== "src/lib/team-helmets.ts") {
    assert.doesNotMatch(src, /["'`]\/helmets\/[A-Za-z0-9_-]+\.png/, `${rel(file)} hardcodes a helmet PNG path`);
  }
  if (/<img\s/.test(src) && /helmet|TeamLogo|logoUrl/i.test(src)) {
    assert.ok(
      LOGO_IMG_RENDERERS.includes(rel(file)),
      `${rel(file)} renders a team logo without TeamLogo`
    );
  }
}
const emailHelmets = fs.readFileSync(path.join(root, "src/lib/week-wrap-html-util.ts"), "utf8");
assert.match(emailHelmets, /localHelmetSrc\(abbr\)/, "email helmets use the alias map");

const teamLogo = fs.readFileSync(path.join(root, "src/components/TeamLogo.tsx"), "utf8");
assert.match(teamLogo, /resolveTeamLogoSrc/, "TeamLogo resolves through the alias map");
assert.match(teamLogo, /naturalWidth === 0/, "TeamLogo catches errors that fired before hydration");
assert.doesNotMatch(teamLogo, /espncdn|https?:/, "TeamLogo is local-only");

const readme = fs.readFileSync(path.join(helmetDir, "README.md"), "utf8");
assert.match(readme, /team-abbr\.ts/, "helmet README points at the alias map");

console.log(`verify-helmet-aliases: ok (${spellings.length} spellings, ${checked} variants)`);

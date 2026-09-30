/**
 * Per-pool "Team logos" switch and the TEAM_LOGOS_DISABLED override. No database.
 *
 *   npx tsx scripts/verify-team-logos-setting.tsx
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TeamLogo, TEAM_LOGO_SIZE } from "../src/components/TeamLogo";
import { TeamLogosProvider } from "../src/components/TeamLogosContext";
import {
  showTeamLogosFor,
  teamLogosForcedOff,
  teamMarkText,
} from "../src/lib/team-logos";
import { weekWrapContent } from "../src/lib/week-wrap-copy";
import { teamBadgeHtml } from "../src/lib/week-wrap-html-util";
import { wrapNflDivisions } from "../src/lib/week-wrap-nfl";
import { WEEK_WRAP_BOARD_URL } from "../src/lib/week-wrap-sections";
import type { WeekWrapPlayer } from "../src/lib/week-wrap-types";

// tsconfig has jsx: "preserve", so tsx emits classic React.createElement calls.
(globalThis as { React?: typeof React }).React = React;

const read = (file: string) => readFileSync(file, "utf8");

// --- Setting + env override -------------------------------------------------
const noEnv = {};
assert.equal(showTeamLogosFor(null, noEnv), true, "null (existing pools) is on");
assert.equal(showTeamLogosFor(undefined, noEnv), true, "missing is on");
assert.equal(showTeamLogosFor(true, noEnv), true);
assert.equal(showTeamLogosFor(false, noEnv), false);
for (const value of ["true", "TRUE", " true "]) {
  const env = { TEAM_LOGOS_DISABLED: value };
  assert.equal(teamLogosForcedOff(env), true, `forced by ${JSON.stringify(value)}`);
  for (const setting of [null, undefined, true, false]) {
    assert.equal(showTeamLogosFor(setting, env), false, "env overrides every pool");
  }
}
for (const value of ["", "false", "0", "1", "yes"]) {
  assert.equal(teamLogosForcedOff({ TEAM_LOGOS_DISABLED: value }), false);
}
const pools = [
  { id: "family", showTeamLogos: null },
  { id: "office", showTeamLogos: false },
  { id: "cousins", showTeamLogos: true },
];
assert.deepEqual(
  pools.map((pool) => showTeamLogosFor(pool.showTeamLogos, noEnv)),
  [true, false, true],
  "turning one pool off leaves the others on"
);
assert.deepEqual(
  pools.map((pool) => showTeamLogosFor(pool.showTeamLogos, { TEAM_LOGOS_DISABLED: "true" })),
  [false, false, false]
);
assert.equal(teamMarkText("buf"), "BUF");
assert.equal(teamMarkText(" WSH "), "WAS");
assert.equal(teamMarkText("LA"), "LAR");
console.log("PASS  null = on, per-pool off, TEAM_LOGOS_DISABLED=true forces every pool");

// --- One shared TeamLogo ----------------------------------------------------
const render = (on: boolean | null, size?: number) => {
  const logo = <TeamLogo abbr="BUF" size={size} />;
  return renderToStaticMarkup(on == null ? logo : <TeamLogosProvider on={on}>{logo}</TeamLogosProvider>);
};
assert.match(render(null), /<img[^>]*src="\/helmets\/buf\.png"/, "no provider → helmet");
assert.match(render(true), /<img[^>]*src="\/helmets\/buf\.png"/);
const badge = render(false);
assert.doesNotMatch(badge, /<img|helmets/);
assert.match(badge, />BUF<\/span>/);
assert.match(badge, /bg-stadium-800/);
assert.match(badge, /border-stadium-border/);
assert.doesNotMatch(badge, /#[0-9a-f]{3,6}|primaryColor|rgb\(/i, "neutral theme classes only");
for (const size of Object.values(TEAM_LOGO_SIZE).concat(24)) {
  const on = render(true, size);
  const off = render(false, size);
  assert.match(on, new RegExp(`width:${size}px;height:${size}px`));
  assert.match(off, new RegExp(`width:${size}px;height:${size}px`), `badge keeps ${size}px square`);
}
console.log("PASS  TeamLogo swaps to a same-size neutral BUF badge when off");

// --- Week-wrap email ----------------------------------------------------------
const player = (id: string, nickname: string, teamAbbr: string, result: string): WeekWrapPlayer => ({
  id, nickname, status: result === "loss" ? "one_loss" : "undefeated", teamAbbr, result, eliminatedThisWeek: false,
});
const players = [player("a", "Ada", "BUF", "win"), player("b", "Bea", "KC", "loss")];
const nfl = wrapNflDivisions([
  { abbr: "BUF", conference: "AFC", division: "East", wins: 3, losses: 0, ties: 0, divisionRank: 1 },
  { abbr: "KC", conference: "AFC", division: "West", wins: 1, losses: 2, ties: 0, divisionRank: 1 },
]);
const board = [
  { id: "a", nickname: "Ada", status: "undefeated", losses: 0, weeksSurvived: 3 },
  { id: "b", nickname: "Bea", status: "one_loss", losses: 1, weeksSurvived: 2 },
];
const blocks = { roster: true, picks: true, board: true, drama: false };
const wrap = (teamLogos?: boolean) =>
  weekWrapContent({
    tone: "facts",
    blocks,
    facts: { weekNumber: 3, players, boardUrl: WEEK_WRAP_BOARD_URL, board, nfl, teamLogos },
  }).html ?? "";
const helmets = (html: string) => (html.match(/\/helmets\/[a-z]+\.png/g) ?? []).length;
const badges = (html: string) => (html.match(/role="presentation" width="(18|24|28)" height="\1"/g) ?? []).length;
const onHtml = wrap(true);
const offHtml = wrap(false);
assert.equal(wrap(undefined), onHtml, "missing flag = logos on");
assert.equal(helmets(onHtml), 6, "results 2 + board 2 + NFL 2");
assert.equal(badges(onHtml), 0);
assert.equal(helmets(offHtml), 0, "no helmet URLs when off");
assert.equal(badges(offHtml), 6, "one badge where each helmet was");
assert.match(teamBadgeHtml("BUF", 28), /width:28px;height:28px/);
assert.match(teamBadgeHtml("BUF", 28), />BUF<\/td>/);
assert.match(teamBadgeHtml("WSH", 18), />WAS<\/td>/);
console.log("PASS  week-wrap email swaps every helmet for a same-size badge");

// --- Wiring -------------------------------------------------------------------
function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}
const helmetRenderers = new Set([
  "src/components/TeamLogo.tsx",
  "src/lib/week-wrap-html-util.ts",
]);
for (const file of walk("src").filter((f) => /\.(tsx?|jsx?)$/.test(f))) {
  const rel = file.split(path.sep).join("/");
  const text = read(file);
  if (/\.tsx$/.test(rel) && !helmetRenderers.has(rel)) {
    assert.doesNotMatch(
      text,
      /resolveTeamLogoSrc|localHelmetSrc|helmetSrcCandidates|["'`]\/helmets\//,
      `${rel} must render team marks through TeamLogo`
    );
  }
  if (!helmetRenderers.has(rel)) {
    assert.doesNotMatch(text, /\bhelmetImg\(/, `${rel} must use teamMarkHtml`);
  }
}
const layout = read("src/app/(app)/layout.tsx");
assert.match(layout, /<TeamLogosProvider on=\{chrome\.showTeamLogos\}>/);
assert.match(read("src/app/(app)/load-app-membership.ts"), /showTeamLogosFor\(membership\.pool\.showTeamLogos\)/);
assert.match(read("src/lib/week-wrap-send.ts"), /teamLogos: showTeamLogosFor\(week\.pool\.showTeamLogos\)/);
assert.match(read("src/lib/week-wrap-load.ts"), /teamLogos: showTeamLogosFor\(pool\?\.showTeamLogos\)/);
assert.match(read("src/components/features/admin/use-week-wrap.ts"), /teamLogos: data\.teamLogos/);
console.log("PASS  every app screen, popup, and email reads the one pool switch");

const route = read("src/app/api/admin/team-logos/route.ts");
assert.match(route, /const admin = await requireAdmin\(\);\s*if \(!admin\) return NextResponse\.json\(\{ error: "Forbidden" \}, \{ status: 403 \}\)/);
assert.match(route, /where: \{ id: poolId \}, data: \{ showTeamLogos: next \}/);
assert.match(route, /const poolId = admin\.membership\.poolId;/);
assert.match(route, /auditLog\.create/);
assert.match(route, /action: "pool_team_logos"/);
assert.match(read("src/components/features/admin/audit-labels.ts"), /pool_team_logos: "Changed team logos"/);
const card = read("src/components/features/admin/TeamLogosCard.tsx");
assert.match(card, />Team logos</);
assert.match(card, /Off shows team abbreviations instead of logos\./);
assert.match(card, /\/api\/admin\/team-logos/);
assert.match(read("src/components/features/admin/ConfigScreen.tsx"), /<TeamLogosCard/);
assert.match(
  read("src/components/features/help/HelpForAdmins.tsx"),
  /Team logos can be turned off in <strong>Admin → Pool<\/strong>\./
);
for (const file of [
  "src/components/features/admin/TeamLogosCard.tsx",
  "src/app/api/admin/team-logos/route.ts",
  "src/lib/team-logos.ts",
]) {
  assert.doesNotMatch(read(file), /commissioner/i, `${file} says Administrator`);
}
console.log("PASS  Admin → Pool toggle is Administrator-only and audit-logged; Help line present");

const schema = read("prisma/schema.prisma");
assert.match(schema, /showTeamLogos Boolean\? @default\(true\)/);
const migrationDir = readdirSync("prisma/migrations").find((name) => name.endsWith("_pool_show_team_logos"));
assert.ok(migrationDir, "migration folder");
const sql = read(`prisma/migrations/${migrationDir}/migration.sql`);
assert.match(sql, /ALTER TABLE "Pool" ADD COLUMN IF NOT EXISTS "showTeamLogos" BOOLEAN DEFAULT true;/);
assert.doesNotMatch(sql.replace(/^--.*$/gm, ""), /\b(UPDATE|DELETE|DROP|TRUNCATE|NOT NULL)\b/i, "additive only");
assert.match(read("src/lib/pool-rules-schema.ts"), /ADD COLUMN IF NOT EXISTS "showTeamLogos" BOOLEAN DEFAULT true/);
assert.match(read("src/lib/session.ts"), /\|showTeamLogos\|/);
console.log("PASS  additive nullable column, default on, boot fallback");

console.log("\nverify-team-logos-setting OK");

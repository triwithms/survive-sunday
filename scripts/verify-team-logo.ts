/**
 * Team badge helper (no network).
 *
 *   npx tsx scripts/verify-team-logo.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ESPN_TEAM_IDS } from "../src/lib/espn-teams";
import { TEAM_BADGES, badgeAbbr, teamBadge, teamBadgeSvg } from "../src/lib/team-badges";
import { TEAM_LOGO_SIZE } from "../src/lib/team-logo-size";

assert.equal(Object.keys(TEAM_BADGES).length, 32);
assert.equal(Object.keys(TEAM_BADGES).sort().join(","), Object.keys(ESPN_TEAM_IDS).sort().join(","));

for (const abbr of Object.keys(TEAM_BADGES)) {
  const b = teamBadge(abbr);
  assert.equal(b.abbr, abbr);
  assert.match(b.primary, /^#[0-9A-Fa-f]{6}$/, `${abbr} primary`);
  assert.match(b.secondary, /^#[0-9A-Fa-f]{6}$/, `${abbr} secondary`);
  const svg = teamBadgeSvg(abbr);
  assert.match(svg, /<circle/);
  assert.ok(svg.includes(b.abbr));
  assert.ok(!svg.includes("espncdn"));
}

assert.equal(badgeAbbr("WSH"), "WAS");
assert.equal(badgeAbbr("JAC"), "JAX");
assert.equal(teamBadge("BUF").abbr, "BUF");
assert.equal(teamBadge("DET").primary, "#0076B6");
assert.equal(teamBadge("KC").primary, "#E31837");
assert.equal(teamBadge("WAS").abbr, "WAS");
assert.equal(teamBadge("wsh").abbr, "WAS");
assert.equal(teamBadge("JAC").abbr, "JAX");

assert.equal(TEAM_LOGO_SIZE.compact, 44);
assert.equal(TEAM_LOGO_SIZE.row, 48);
assert.equal(TEAM_LOGO_SIZE.slate, 66);
assert.equal(TEAM_LOGO_SIZE.featured, 84);
assert.equal(TEAM_LOGO_SIZE.hero, 96);

const badgeDir = path.join(process.cwd(), "public/team-badges");
for (const abbr of Object.keys(TEAM_BADGES)) {
  const file = path.join(badgeDir, `${abbr.toLowerCase()}.svg`);
  assert.equal(fs.existsSync(file), true, file);
  const body = fs.readFileSync(file, "utf8");
  assert.match(body, /<svg/);
  assert.ok(body.includes(abbr));
}

console.log("verify-team-logo: ok");

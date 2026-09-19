/**
 * Team research hub: style above coach, unit + injuries + news links,
 * no Key players / roster dump. Feature files stay ≤100 lines.
 * Each Look closer item is its own route/page.
 *
 *   npx tsx scripts/verify-team-page.ts
 */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import {
  isTeamSection,
  isTeamUnit,
  teamHref,
  unitTitle,
} from "../src/components/features/team/team-paths";

function lineCount(path: string): number {
  const text = readFileSync(path, "utf8");
  if (!text) return 0;
  return text.split("\n").length - (text.endsWith("\n") ? 1 : 0);
}

function read(path: string): string {
  return readFileSync(path, "utf8");
}

function main() {
  const dir = "src/components/features/team";
  for (const name of readdirSync(dir)) {
    if (!/\.(ts|tsx)$/.test(name)) continue;
    const n = lineCount(join(dir, name));
    assert.ok(n <= 100, `${name} is ${n} lines (max 100)`);
  }

  const routes = [
    ["src/app/(app)/team/[abbr]/page.tsx", "TeamScreen"],
    ["src/app/(app)/team/[abbr]/offence/page.tsx", 'unit="offence"'],
    ["src/app/(app)/team/[abbr]/defence/page.tsx", 'unit="defence"'],
    ["src/app/(app)/team/[abbr]/special-teams/page.tsx", 'unit="special-teams"'],
    ["src/app/(app)/team/[abbr]/injuries/page.tsx", "TeamInjuriesScreen"],
    ["src/app/(app)/team/[abbr]/news/page.tsx", "TeamNewsScreen"],
  ] as const;
  for (const [path, needle] of routes) {
    assert.ok(existsSync(path), `missing ${path}`);
    const n = lineCount(path);
    assert.ok(n <= 100, `${path} is ${n} lines (max 100)`);
    const src = read(path);
    assert.match(src, new RegExp(needle));
    assert.doesNotMatch(src, /Key players/);
    assert.doesNotMatch(src, />Roster</);
  }
  assert.equal(
    existsSync("src/app/(app)/team/[abbr]/[section]/page.tsx"),
    false,
    "combined [section] page must not exist"
  );

  const screen = read(`${dir}/TeamScreen.tsx`);
  const styleAt = screen.indexOf("<TeamStyle");
  const coachAt = screen.indexOf("<TeamCoach");
  assert.ok(styleAt >= 0 && coachAt > styleAt, "style above coach");
  assert.doesNotMatch(screen, /Key players/);
  assert.doesNotMatch(screen, />Roster</);

  const closer = read(`${dir}/TeamLookCloser.tsx`);
  for (const label of ["Offence", "Defence", "Special teams", "Injuries", "News"]) {
    assert.match(closer, new RegExp(label));
  }
  assert.match(closer, /special-teams/);
  assert.doesNotMatch(closer, /section: "special"/);

  const toggle = read(`${dir}/TeamStartersToggle.tsx`);
  assert.match(toggle, /Starters only/);
  assert.match(toggle, /type="checkbox"/);

  assert.equal(isTeamSection("offence"), true);
  assert.equal(isTeamSection("special-teams"), true);
  assert.equal(isTeamSection("special"), false);
  assert.equal(isTeamSection("player"), false);
  assert.equal(isTeamUnit("special-teams"), true);
  assert.equal(isTeamUnit("news"), false);
  assert.equal(teamHref("kc"), "/team/KC");
  assert.equal(teamHref("kc", "offence"), "/team/KC/offence");
  assert.equal(teamHref("kc", "defence"), "/team/KC/defence");
  assert.equal(teamHref("kc", "special-teams"), "/team/KC/special-teams");
  assert.equal(teamHref("kc", "injuries"), "/team/KC/injuries");
  assert.equal(teamHref("kc", "news"), "/team/KC/news");
  assert.equal(unitTitle("special-teams"), "Special teams");

  console.log("verify-team-page: ok");
}

main();

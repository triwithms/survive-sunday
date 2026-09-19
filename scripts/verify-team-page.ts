/**
 * Team research hub: style above coach, unit + injuries + news links,
 * no Key players / roster dump. Feature files stay ≤100 lines.
 *
 *   npx tsx scripts/verify-team-page.ts
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { isTeamSection, isTeamUnit, teamHref, unitTitle } from "../src/components/features/team/team-paths";

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

  const pages = [
    "src/app/(app)/team/[abbr]/page.tsx",
    "src/app/(app)/team/[abbr]/[section]/page.tsx",
  ];
  for (const path of pages) {
    const n = lineCount(path);
    assert.ok(n <= 100, `${path} is ${n} lines (max 100)`);
    const src = read(path);
    assert.doesNotMatch(src, /Key players/);
    assert.doesNotMatch(src, />Roster</);
  }

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

  const toggle = read(`${dir}/TeamStartersToggle.tsx`);
  assert.match(toggle, /Starters only/);
  assert.match(toggle, /type="checkbox"/);

  const unit = read(`${dir}/TeamUnitScreen.tsx`);
  assert.match(unit, /TeamStartersToggle/);
  assert.match(unit, /NflPlayerRows/);

  const injuries = read(`${dir}/TeamInjuriesScreen.tsx`);
  assert.match(injuries, />Injuries</);
  assert.match(injuries, /TeamInjuryList/);

  const news = read(`${dir}/TeamNewsScreen.tsx`);
  assert.match(news, />News</);
  assert.match(news, /TeamNewsList/);
  assert.match(news, /No headlines for this team right now/);

  assert.equal(isTeamSection("offence"), true);
  assert.equal(isTeamSection("player"), false);
  assert.equal(isTeamUnit("special"), true);
  assert.equal(isTeamUnit("news"), false);
  assert.equal(teamHref("kc", "injuries"), "/team/KC/injuries");
  assert.equal(unitTitle("special"), "Special teams");

  console.log("verify-team-page: ok");
}

main();

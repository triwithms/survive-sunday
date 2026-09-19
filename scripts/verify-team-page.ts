/**
 * Team research hub: style above coach, unit + injuries + news links,
 * no Key players / roster dump. Feature files stay ≤100 lines.
 * Each Look closer item is its own route/page.
 * Unit lists: healthy starters, then injured starters.
 *
 *   npx tsx scripts/verify-team-page.ts
 */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import {
  listUnitPlayers,
  splitUnitPlayers,
} from "../src/components/features/team/order-unit-players";
import { mergeTeamSchedule } from "../src/components/features/team/merge-team-schedule";
import {
  teamGameResult,
  teamScoreLine,
} from "../src/components/features/team/team-schedule";
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
    ["src/app/(app)/team/[abbr]/schedule/page.tsx", "TeamScheduleScreen"],
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
  for (const label of [
    "Schedule",
    "Offence",
    "Defence",
    "Special teams",
    "Injuries",
    "News",
  ]) {
    assert.match(closer, new RegExp(label));
  }
  assert.match(closer, /section: "schedule"/);
  assert.match(closer, /special-teams/);
  assert.doesNotMatch(closer, /section: "special"/);

  const nav = read(`${dir}/TeamNav.tsx`);
  assert.match(nav, /teamHref\(abbr, "schedule"\)/);
  assert.doesNotMatch(nav, /href="\/schedule"/);

  const toggle = read(`${dir}/TeamStartersToggle.tsx`);
  assert.match(toggle, /Starters only/);
  assert.match(toggle, /type="checkbox"/);

  const unit = read(`${dir}/TeamUnitScreen.tsx`);
  assert.match(unit, /TeamStartersToggle/);
  assert.match(unit, /splitUnitPlayers/);
  assert.match(unit, /TeamUnitBlocks/);
  const blocks = read(`${dir}/TeamUnitBlocks.tsx`);
  assert.match(blocks, /heading="Injured"/);
  assert.match(blocks, /"Depth"/);
  const injuries = read(`${dir}/TeamInjuriesScreen.tsx`);
  assert.match(injuries, />Injuries</);
  assert.doesNotMatch(unit, />Injuries</);

  const sample = [
    { name: "Injured starter", role: "starter", injury: { status: "Out" } },
    { name: "Healthy starter", role: "starter", injury: null },
    { name: "Depth", role: "depth", injury: null },
    { name: "Injured depth", role: "depth", injury: { status: "Questionable" } },
  ];
  assert.deepEqual(
    listUnitPlayers(sample, false).map((p) => p.name),
    ["Healthy starter", "Injured starter"]
  );
  const showAll = listUnitPlayers(sample, true).map((p) => p.name);
  assert.deepEqual(showAll, [
    "Healthy starter",
    "Injured starter",
    "Depth",
    "Injured depth",
  ]);
  assert.ok(showAll.indexOf("Healthy starter") < showAll.indexOf("Injured starter"));
  const groups = splitUnitPlayers(sample);
  assert.deepEqual(
    groups.healthyStarters.map((p) => p.name),
    ["Healthy starter"]
  );
  assert.deepEqual(
    groups.injuredStarters.map((p) => p.name),
    ["Injured starter"]
  );
  const noStarters = [
    { name: "A", role: "depth", injury: { status: "Out" } },
    { name: "B", role: "roster", injury: null },
  ];
  assert.deepEqual(
    listUnitPlayers(noStarters, false).map((p) => p.name),
    ["A", "B"]
  );

  assert.equal(isTeamSection("schedule"), true);
  assert.equal(isTeamSection("offence"), true);
  assert.equal(isTeamSection("special-teams"), true);
  assert.equal(isTeamSection("special"), false);
  assert.equal(isTeamSection("player"), false);
  assert.equal(isTeamUnit("special-teams"), true);
  assert.equal(isTeamUnit("schedule"), false);
  assert.equal(isTeamUnit("news"), false);
  assert.equal(teamHref("kc"), "/team/KC");
  assert.equal(teamHref("kc", "schedule"), "/team/KC/schedule");
  assert.equal(teamHref("kc", "offence"), "/team/KC/offence");
  assert.equal(teamHref("kc", "defence"), "/team/KC/defence");
  assert.equal(teamHref("kc", "special-teams"), "/team/KC/special-teams");
  assert.equal(teamHref("kc", "injuries"), "/team/KC/injuries");
  assert.equal(teamHref("kc", "news"), "/team/KC/news");
  assert.equal(unitTitle("special-teams"), "Special teams");

  const finalHome = {
    id: "w1",
    week: 1,
    awayAbbr: "BUF",
    homeAbbr: "KC",
    kickoff: "2026-09-13T17:00:00Z",
    status: "final",
    scoreAway: 17,
    scoreHome: 24,
  };
  assert.equal(teamGameResult("KC", finalHome), "win");
  assert.equal(teamGameResult("BUF", finalHome), "loss");
  assert.equal(teamScoreLine("KC", finalHome), "24–17");
  assert.equal(teamScoreLine("BUF", finalHome), "17–24");
  assert.equal(
    teamGameResult("KC", { ...finalHome, scoreAway: 20, scoreHome: 20 }),
    "tie"
  );
  assert.equal(teamGameResult("KC", { ...finalHome, status: "live" }), null);
  assert.equal(
    teamGameResult("KC", { ...finalHome, scoreAway: null, scoreHome: null }),
    null
  );

  const merged = mergeTeamSchedule(
    "KC",
    [finalHome],
    [
      {
        week: 2,
        awayAbbr: "KC",
        homeAbbr: "PHI",
        kickoff: "2026-09-20T17:00:00Z",
      },
    ]
  );
  assert.equal(merged.length, 18);
  assert.equal(merged[0]?.result, "win");
  assert.equal(merged[0]?.scoreLine, "24–17");
  assert.equal(merged[1]?.status, "scheduled");
  assert.equal(merged[1]?.opponentAbbr, "PHI");
  assert.equal(merged[1]?.atHome, false);
  assert.match(merged[1]?.kickoffLabel ?? "", /ET/);
  assert.doesNotMatch(merged[1]?.kickoffLabel ?? "", /FOX|CBS|NBC|ESPN|Prime/);
  assert.ok(merged.some((row) => row.bye));

  const live = mergeTeamSchedule(
    "KC",
    [{ ...finalHome, status: "scheduled", scoreAway: null, scoreHome: null }],
    null,
    new Map([
      [
        1,
        [
          {
            awayAbbr: "BUF",
            homeAbbr: "KC",
            status: "live",
            scoreAway: 3,
            scoreHome: 14,
            clockLabel: "Q2 4:00",
          },
        ],
      ],
    ])
  );
  assert.equal(live[0]?.status, "live");
  assert.equal(live[0]?.scoreLine, "14–3");
  assert.equal(live[0]?.liveClock, "Q2 4:00");
  assert.equal(live.length, 1);

  const keepFinal = mergeTeamSchedule(
    "KC",
    [finalHome],
    null,
    new Map([
      [
        1,
        [
          {
            awayAbbr: "BUF",
            homeAbbr: "KC",
            status: "scheduled",
            scoreAway: null,
            scoreHome: null,
          },
        ],
      ],
    ])
  );
  assert.equal(keepFinal[0]?.result, "win");

  for (const name of [
    "TeamScheduleRow.tsx",
    "TeamScheduleList.tsx",
    "TeamScheduleScreen.tsx",
    "load-team-schedule.ts",
  ]) {
    const src = read(`${dir}/${name}`);
    assert.doesNotMatch(src, /FOX|CBS|NBC|Prime Video|network/i);
    assert.doesNotMatch(src, /InjuryStatusChip|injuryChipClass/);
  }

  const bottom = read("src/components/BottomNav.tsx");
  assert.match(bottom, /href: "\/schedule"/);
  assert.doesNotMatch(bottom, /\/team\/.*schedule/);

  console.log("verify-team-page: ok");
}

main();

/**
 * Unused-team list for commissioner phone pick entry (no DB).
 *
 *   npx tsx scripts/verify-enter-pick.ts
 */
import { unusedTeamsForWeek, pickForWeek } from "../src/components/features/admin/enter-pick-options";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function main() {
  const gams = {
    id: "g",
    nickname: "Gams",
    realName: "Robert",
    status: "undefeated",
    usedTeams: ["DET"],
    picks: [
      { weekNumber: 1, teamAbbr: "DET" },
      { weekNumber: 2, teamAbbr: "PHI" },
    ],
  };
  const week2 = [
    { abbr: "PHI", name: "PHI Eagles vs KC" },
    { abbr: "KC", name: "KC Chiefs @ PHI" },
    { abbr: "DET", name: "DET Lions vs CHI" },
    { abbr: "BUF", name: "BUF Bills vs NYJ" },
  ];
  const unused = unusedTeamsForWeek({
    weekTeams: week2,
    member: gams,
    weekNumber: 2,
  });
  const abbrs = unused.map((t) => t.abbr).join(",");
  assert(abbrs.includes("PHI"), "current week pick stays selectable");
  assert(abbrs.includes("KC") && abbrs.includes("BUF"), "fresh teams");
  assert(!abbrs.includes("DET"), "week 1 team is used");
  assert(pickForWeek(gams, 2) === "PHI", "current pick");

  const missed = {
    ...gams,
    picks: [{ weekNumber: 1, teamAbbr: "MISS" }],
    usedTeams: [],
  };
  const afterMiss = unusedTeamsForWeek({
    weekTeams: week2,
    member: missed,
    weekNumber: 2,
  });
  assert(afterMiss.some((t) => t.abbr === "DET"), "MISS is not a used team");

  console.log("verify-enter-pick OK");
}

main();

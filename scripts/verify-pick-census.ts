/**
 * Pick census is read-only math (no DB writes).
 *
 *   npx tsx scripts/verify-pick-census.ts
 */
import { buildPickCensus } from "../src/components/features/admin/pick-census";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function main() {
  const members = [
    { id: "a", nickname: "AdminSeat", status: "undefeated", role: "admin", isParticipant: true },
    { id: "s", nickname: "Spectator", status: "undefeated", role: "member", isParticipant: false },
    { id: "e", nickname: "Out", status: "eliminated", role: "member", isParticipant: true },
    { id: "late", nickname: "LateJoin", status: "undefeated", role: "member", isParticipant: true, playingFromWeek: 4 },
    { id: "g", nickname: "Gams", status: "undefeated", role: "member", isParticipant: true },
    { id: "j", nickname: "JimmyC", status: "one_loss", role: "member", isParticipant: true },
    { id: "c", nickname: "Cannoli", status: "undefeated", role: "member", isParticipant: true },
    { id: "k", nickname: "JaJa", status: "undefeated", role: "member", isParticipant: true },
  ];
  const picks = [
    { membershipId: "g", teamAbbr: "PHI", source: "user" },
    { membershipId: "c", teamAbbr: "DAL", source: "imported" },
    { membershipId: "k", teamAbbr: "MISS", source: "missed" },
    { membershipId: "e", teamAbbr: "KC", source: "user" },
  ];

  const census = buildPickCensus(2, members, picks);
  assert(census.weekNumber === 2, "week");
  assert(census.shouldPick === 4, `due ${census.shouldPick}`);
  assert(census.submitted === 2, `submitted ${census.submitted}`);
  assert(census.outstanding === 2, `out ${census.outstanding}`);
  assert(
    census.outstandingNicknames.join(",") === "JaJa,JimmyC",
    census.outstandingNicknames.join(",")
  );
  assert(census.submitted + census.outstanding === census.shouldPick, "add up");
  assert(!census.outstandingNicknames.includes("AdminSeat"), "no spectator");
  assert(!census.outstandingNicknames.includes("Out"), "no eliminated");
  assert(!census.outstandingNicknames.includes("LateJoin"), "no late start");

  const empty = buildPickCensus(2, [], []);
  assert(empty.shouldPick === 0 && empty.outstanding === 0, "empty pool");

  const allIn = buildPickCensus(
    2,
    [{ id: "g", nickname: "Gams", status: "undefeated", role: "member" }],
    [{ membershipId: "g", teamAbbr: "PHI", source: "user" }]
  );
  assert(allIn.outstanding === 0 && allIn.submitted === 1, "everyone in");

  console.log("verify-pick-census OK");
}

main();

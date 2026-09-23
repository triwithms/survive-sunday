import { lostStillIn, wrapResultGroups } from "./week-wrap-results";
import type { WeekWrapFacts } from "./week-wrap-types";

export type WeekWrapCounts = {
  stillIn: number;
  won: number;
  /** Lost this week and still alive (mulligan). */
  hit: number;
  out: number;
  pending: number;
};

/** Counts behind the automatic copy. Same groups as the Won / Lost lists. */
export function weekWrapCounts(facts: WeekWrapFacts): WeekWrapCounts {
  const groups = wrapResultGroups(facts.players);
  return {
    stillIn: facts.players.filter((player) => player.status !== "eliminated").length,
    won: groups.won.length,
    hit: groups.lost.filter(lostStillIn).length,
    out: groups.out.length,
    pending: groups.pending.length,
  };
}

/**
 * One factual line, e.g. `Week 3 wrap: 12 still in, 2 took a hit, nobody out.`
 * Built only from WeekWrapFacts: no model, no API call, never a made-up result.
 */
export function weekWrapAutoIntro(facts: WeekWrapFacts): string {
  const c = weekWrapCounts(facts);
  const bits = [
    c.stillIn ? `${c.stillIn} still in` : "nobody still in",
    c.hit ? `${c.hit} took a hit` : "nobody took a hit",
    c.out ? `${c.out} eliminated` : "nobody out",
  ];
  if (c.pending) bits.push(`${c.pending} with no result yet`);
  const line = `Week ${facts.weekNumber} wrap: ${bits.join(", ")}.`;
  const alive = facts.players.filter((player) => player.status !== "eliminated");
  return alive.length === 1 ? `${line} ${alive[0].nickname} is the last one standing.` : line;
}

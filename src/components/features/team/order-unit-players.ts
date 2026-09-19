import { splitRosterPlayers } from "@/lib/team-research";

export type UnitListPlayer = {
  role: string;
  injury: unknown;
};

export function splitUnitPlayers<T extends UnitListPlayer>(players: T[]): {
  healthyStarters: T[];
  injuredStarters: T[];
  depth: T[];
} {
  const { starters, depth } = splitRosterPlayers(players);
  return {
    healthyStarters: starters.filter((p) => !p.injury),
    injuredStarters: starters.filter((p) => p.injury),
    depth,
  };
}

/** Healthy starters, then injured starters, then depth when showing more. */
export function listUnitPlayers<T extends UnitListPlayer>(
  players: T[],
  showAll: boolean
): T[] {
  const { healthyStarters, injuredStarters, depth } = splitUnitPlayers(players);
  const starters = [...healthyStarters, ...injuredStarters];
  if (starters.length === 0) return players;
  return showAll ? [...starters, ...depth] : starters;
}

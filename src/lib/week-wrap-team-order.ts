import type { WeekWrapPlayer } from "./week-wrap-types";

/** Upper-case team, or "" for blank / MISS (the no-pick group). */
export function wrapTeamKey(player: WeekWrapPlayer): string {
  const abbr = (player.teamAbbr ?? "").trim().toUpperCase();
  return abbr === "MISS" ? "" : abbr;
}

/**
 * Same-team picks sit together. Bigger groups first, ties by team A–Z,
 * no pick last. Nicknames A–Z inside each group.
 */
export function groupByTeam<T extends WeekWrapPlayer>(players: T[]): T[][] {
  const groups = new Map<string, T[]>();
  for (const player of players) {
    const key = wrapTeamKey(player);
    groups.set(key, [...(groups.get(key) ?? []), player]);
  }
  return [...groups.entries()]
    .sort(([keyA, a], [keyB, b]) => {
      if (!keyA !== !keyB) return keyA ? -1 : 1;
      return b.length - a.length || keyA.localeCompare(keyB);
    })
    .map(([, list]) => [...list].sort((a, b) => a.nickname.localeCompare(b.nickname)));
}

export function sortByTeam<T extends WeekWrapPlayer>(players: T[]): T[] {
  return groupByTeam(players).flat();
}

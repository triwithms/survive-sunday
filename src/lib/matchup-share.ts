/** Matchup deep link: existing /scores?week= plus game= id. */

import { PAGE_SHARE_TITLE } from "@/lib/page-share";

export const MATCHUP_GAME_PARAM = "game";

export function matchupGameParam(
  raw: string | string[] | undefined | null
): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const id = value?.trim();
  return id ? id : null;
}

export function weekQueryForGame(
  weeks: Array<{ number: number; games: Array<{ id: string }> }>,
  gameId: string | null
): string | undefined {
  if (!gameId) return undefined;
  const week = weeks.find((row) => row.games.some((g) => g.id === gameId));
  return week ? String(week.number) : undefined;
}

export function matchupSharePath(gameId: string, weekNumber: number): string {
  const params = new URLSearchParams();
  if (Number.isInteger(weekNumber) && weekNumber > 0) {
    params.set("week", String(weekNumber));
  }
  params.set(MATCHUP_GAME_PARAM, gameId);
  return `/scores?${params.toString()}`;
}

export function matchupShareHref(
  origin: string,
  gameId: string,
  weekNumber: number
): string {
  return `${origin.replace(/\/$/, "")}${matchupSharePath(gameId, weekNumber)}`;
}

export function matchupShareTitle(awayAbbr: string, homeAbbr: string): string {
  return `${PAGE_SHARE_TITLE} — ${awayAbbr.trim().toUpperCase()} @ ${homeAbbr.trim().toUpperCase()}`;
}

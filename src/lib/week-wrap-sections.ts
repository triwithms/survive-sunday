import { PUBLIC_APP_ORIGIN } from "./invite-link";
import { isWrapLoss } from "./week-wrap-players";
import { groupByTeam, wrapTeamKey } from "./week-wrap-team-order";
import type { WeekWrapBlocks, WeekWrapFacts, WeekWrapPlayer } from "./week-wrap-types";

export const WEEK_WRAP_BOARD_URL = `${PUBLIC_APP_ORIGIN}/standings`;

function names(list: string[]): string {
  return list.length ? list.join(", ") : "nobody";
}

function rosterLines(facts: WeekWrapFacts): string[] {
  const still = facts.players
    .filter((player) => player.status !== "eliminated")
    .map((player) => player.nickname);
  const lost = facts.players
    .filter((player) => isWrapLoss(player.teamAbbr, player.result))
    .map((player) => player.nickname);
  const out = facts.players
    .filter((player) => player.eliminatedThisWeek)
    .map((player) => player.nickname);
  return [
    `Still in: ${names(still)}`,
    `Lost: ${names(lost)}`,
    `Eliminated: ${names(out)}`,
  ];
}

function pickLabel(player: WeekWrapPlayer): string {
  const team = wrapTeamKey(player);
  if (!team) return "no pick";
  const result = (player.result ?? "").toLowerCase();
  if (result === "win") return `${team} won`;
  if (result === "loss" || result === "push" || result === "missed") return `${team} lost`;
  return `${team} pending`;
}

/** `BUF won (Ada, Cal); KC lost (Bea)`: one phrase per team, names A–Z. */
function pickPhrases(players: WeekWrapPlayer[]): string {
  const phrases = new Map<string, string[]>();
  for (const player of groupByTeam(players).flat()) {
    const label = pickLabel(player);
    phrases.set(label, [...(phrases.get(label) ?? []), player.nickname]);
  }
  return [...phrases].map(([label, list]) => `${label} (${list.join(", ")})`).join("; ");
}

export function sectionLines(facts: WeekWrapFacts, blocks: WeekWrapBlocks): string[] {
  const lines: string[] = [];
  if (blocks.roster) lines.push(...rosterLines(facts));
  if (blocks.picks) {
    const picks = facts.players.filter((player) => player.teamAbbr);
    lines.push(picks.length ? `Picks: ${pickPhrases(picks)}` : "Picks: none yet");
  }
  if (blocks.board) lines.push(`Leaderboard: ${facts.boardUrl}`);
  return lines;
}

export function weekWrapShortText(
  facts: WeekWrapFacts,
  blocks: WeekWrapBlocks
): string {
  return [`Week ${facts.weekNumber}`, ...sectionLines(facts, blocks)].join("\n");
}

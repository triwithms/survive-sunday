import {
  hasTeamPick,
  lostStillIn,
  nflRecord,
  showWrapResults,
  wrapResultGroups,
  wrapStatusLabel,
} from "./week-wrap-results";
import type { WeekWrapEmailParts } from "./week-wrap-rich-types";
import type { WeekWrapPlayer } from "./week-wrap-types";

function playerLine(player: WeekWrapPlayer, logos: boolean, note = ""): string {
  const pick = !logos ? "" : hasTeamPick(player) ? ` ${player.teamAbbr?.toUpperCase()}` : " no pick";
  return `- ${player.nickname}${pick}${note}`;
}

function resultLines(parts: WeekWrapEmailParts): string[] {
  if (!showWrapResults(parts.blocks)) return [];
  const logos = parts.blocks.picks;
  const groups = wrapResultGroups(parts.facts.players);
  const list = (rows: WeekWrapPlayer[], empty: string, note?: (p: WeekWrapPlayer) => string) =>
    rows.length ? rows.map((p) => playerLine(p, logos, note?.(p))) : [empty];
  const lines = [
    "",
    "Won this week",
    ...list(groups.won, "Nobody this week."),
    "",
    "Lost this week",
    ...list(groups.lost, "Nobody lost this week.", (p) => (lostStillIn(p) ? " (still in)" : "")),
  ];
  if (groups.out.length) lines.push("", "Eliminated this week", ...list(groups.out, ""));
  if (groups.pending.length) lines.push("", "No result yet", ...list(groups.pending, ""));
  return lines;
}

function boardLines(parts: WeekWrapEmailParts): string[] {
  const board = parts.facts.board ?? [];
  if (!board.length) return [];
  return [
    "",
    "Pool leaderboard",
    ...board.map(
      (row, i) =>
        `${i + 1}. ${row.nickname} - ${wrapStatusLabel(row.status)} (losses ${row.losses}, weeks survived ${row.weeksSurvived})`
    ),
  ];
}

function nflLines(parts: WeekWrapEmailParts): string[] {
  const divs = parts.facts.nfl ?? [];
  if (!divs.length) return [];
  return [
    "",
    "NFL division standings",
    ...divs.map(
      (div) =>
        `${div.conference} ${div.division}: ${div.teams.map((t) => `${t.abbr} ${nflRecord(t)}`).join(", ")}`
    ),
  ];
}

/** Plain-text twin of the HTML email, same section order. */
export function weekWrapEmailText(parts: WeekWrapEmailParts): string {
  const lines = [parts.intro, ...resultLines(parts)];
  if (parts.blocks.board) lines.push(...boardLines(parts), ...nflLines(parts));
  if (parts.drama) lines.push("", parts.drama);
  if (parts.clip) lines.push("", parts.clip.title, parts.clip.watchUrl);
  if (parts.blocks.board) lines.push("", `Board: ${parts.facts.boardUrl}`);
  return lines.join("\n");
}

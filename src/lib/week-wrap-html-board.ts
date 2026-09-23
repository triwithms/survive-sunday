import {
  escapeHtml,
  helmetImg,
  WRAP_FONT,
  WRAP_GOLD,
  WRAP_LOSS,
  WRAP_MUTED,
  WRAP_TEXT,
  WRAP_WIN,
  wrapSection,
} from "./week-wrap-html-util";
import { hasTeamPick, wrapStatusLabel } from "./week-wrap-results";
import type { WeekWrapBoardRow } from "./week-wrap-rich-types";
import type { WeekWrapPlayer } from "./week-wrap-types";

const CELL = `padding:6px 0;font-family:${WRAP_FONT};vertical-align:middle;`;

function statusColor(status: string): string {
  if (status === "undefeated") return WRAP_WIN;
  if (status === "eliminated") return WRAP_LOSS;
  return WRAP_GOLD;
}

function boardRow(
  row: WeekWrapBoardRow,
  rank: number,
  pick: WeekWrapPlayer | undefined
): string {
  const out = row.status === "eliminated";
  const logo = pick && hasTeamPick(pick) ? helmetImg(pick.teamAbbr ?? "", 24) : "";
  const meta = `Losses ${row.losses} · Weeks survived ${row.weeksSurvived}`;
  const name = out ? WRAP_MUTED : WRAP_TEXT;
  return `<tr><td width="28" style="${CELL}font-size:13px;color:${WRAP_MUTED};">${rank}</td><td width="32" style="${CELL}">${logo}</td><td style="${CELL}"><div style="font-size:15px;color:${name};">${escapeHtml(row.nickname)}</div><div style="font-size:12px;color:${WRAP_MUTED};">${meta}</div></td><td align="right" style="${CELL}font-size:12px;font-weight:bold;color:${statusColor(row.status)};">${escapeHtml(wrapStatusLabel(row.status))}</td></tr>`;
}

/**
 * Same order as the app Leaderboard (still in first, then fewest losses…).
 * Logo is that seat's pick for this wrap week, when there was one.
 */
export function wrapBoardHtml(
  board: WeekWrapBoardRow[] | undefined,
  players: WeekWrapPlayer[]
): string {
  if (!board?.length) return "";
  const pickById = new Map(players.map((player) => [player.id, player]));
  const rows = board
    .map((row, index) => boardRow(row, index + 1, pickById.get(row.id)))
    .join("");
  return wrapSection("Pool leaderboard", rows);
}

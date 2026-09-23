import {
  escapeHtml,
  helmetImg,
  mutedRow,
  WRAP_FONT,
  WRAP_LOSS,
  WRAP_MUTED,
  WRAP_TEXT,
  WRAP_WIN,
  wrapSection,
} from "./week-wrap-html-util";
import {
  hasTeamPick,
  lostStillIn,
  showWrapResults,
  wrapResultGroups,
} from "./week-wrap-results";
import type { WeekWrapBlocks, WeekWrapPlayer } from "./week-wrap-types";

const CELL = `padding:6px 0;font-family:${WRAP_FONT};vertical-align:middle;`;

function playerRow(
  player: WeekWrapPlayer,
  opts: { logos: boolean; color: string; note?: string }
): string {
  const pick = hasTeamPick(player);
  const logo = opts.logos && pick ? helmetImg(player.teamAbbr ?? "", 28) : "";
  const abbr = opts.logos
    ? pick ? escapeHtml((player.teamAbbr ?? "").toUpperCase()) : "No pick"
    : "";
  const note = opts.note
    ? ` <span style="font-size:12px;color:${WRAP_MUTED};">${escapeHtml(opts.note)}</span>`
    : "";
  const logoCell = opts.logos ? `<td width="36" style="${CELL}">${logo}</td>` : "";
  return `<tr>${logoCell}<td style="${CELL}font-size:15px;color:${WRAP_TEXT};">${escapeHtml(player.nickname)}${note}</td><td align="right" style="${CELL}font-size:13px;font-weight:bold;color:${opts.color};">${abbr}</td></tr>`;
}

function rows(
  list: WeekWrapPlayer[],
  empty: string,
  row: (player: WeekWrapPlayer) => string
): string {
  return list.length ? list.map(row).join("") : mutedRow(empty);
}

/** Won, Lost, Eliminated (only when someone went out), then any ungraded seats. */
export function wrapResultsHtml(
  players: WeekWrapPlayer[],
  blocks: WeekWrapBlocks
): string {
  if (!showWrapResults(blocks)) return "";
  const logos = blocks.picks;
  const groups = wrapResultGroups(players);
  const won = rows(groups.won, "Nobody this week.", (p) =>
    playerRow(p, { logos, color: WRAP_WIN })
  );
  const lost = rows(groups.lost, "Nobody lost this week.", (p) =>
    playerRow(p, { logos, color: WRAP_LOSS, note: lostStillIn(p) ? "still in" : undefined })
  );
  const parts = [
    wrapSection("Won this week", won),
    wrapSection("Lost this week", lost),
  ];
  if (groups.out.length) {
    parts.push(
      wrapSection(
        "Eliminated this week",
        groups.out.map((p) => playerRow(p, { logos, color: WRAP_LOSS })).join("")
      )
    );
  }
  if (groups.pending.length) {
    parts.push(
      wrapSection(
        "No result yet",
        groups.pending.map((p) => playerRow(p, { logos, color: WRAP_MUTED })).join("")
      )
    );
  }
  return parts.join("");
}

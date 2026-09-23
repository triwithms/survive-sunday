import {
  escapeHtml,
  helmetImg,
  TABLE,
  WRAP_FONT,
  WRAP_GOLD,
  WRAP_LINE,
  WRAP_MUTED,
  WRAP_PANEL,
  WRAP_TEXT,
} from "./week-wrap-html-util";
import { nflRecord } from "./week-wrap-results";
import type { WeekWrapNflDivision, WeekWrapNflTeam } from "./week-wrap-rich-types";

const CELL = `padding:3px 0;font-family:${WRAP_FONT};vertical-align:middle;`;

function teamRow(team: WeekWrapNflTeam): string {
  return `<tr><td width="24" style="${CELL}">${helmetImg(team.abbr, 18)}</td><td style="${CELL}font-size:13px;color:${WRAP_TEXT};">${escapeHtml(team.abbr.toUpperCase())}</td><td align="right" style="${CELL}font-size:13px;color:${WRAP_MUTED};">${nflRecord(team)}</td></tr>`;
}

function divisionTable(div: WeekWrapNflDivision): string {
  const title = `<tr><td colspan="3" style="padding:0 0 4px;font-family:${WRAP_FONT};font-size:12px;font-weight:bold;color:${WRAP_GOLD};">${escapeHtml(`${div.conference} ${div.division}`)}</td></tr>`;
  return `<table ${TABLE} style="margin:0 0 12px;">${title}${div.teams.map(teamRow).join("")}</table>`;
}

function column(divs: WeekWrapNflDivision[]): string {
  return divs.map(divisionTable).join("");
}

/**
 * Nested tables, AFC left / NFC right (no inline-block, so Outlook keeps the
 * two columns). Empty string when ESPN standings were unavailable.
 */
export function wrapNflHtml(divs: WeekWrapNflDivision[] | null | undefined): string {
  if (!divs?.length) return "";
  const afc = divs.filter((div) => div.conference === "AFC");
  const nfc = divs.filter((div) => div.conference === "NFC");
  const head = `<tr><td style="padding:0 0 8px;font-family:${WRAP_FONT};font-size:12px;font-weight:bold;letter-spacing:0.08em;text-transform:uppercase;color:${WRAP_GOLD};">NFL division standings</td></tr>`;
  const cols = `<table ${TABLE}><tr><td width="50%" valign="top" style="padding:0 8px 0 0;">${column(afc)}</td><td width="50%" valign="top" style="padding:0 0 0 8px;border-left:1px solid ${WRAP_LINE};">${column(nfc)}</td></tr></table>`;
  const body = `<tr><td style="background:${WRAP_PANEL};border:1px solid ${WRAP_LINE};border-radius:8px;padding:10px 12px 0;">${cols}</td></tr>`;
  return `<table ${TABLE} style="margin:0 0 20px;">${head}${body}</table>`;
}

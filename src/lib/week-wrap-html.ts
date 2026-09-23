import { gameEmailFooterHtml } from "./notify-game-footer";
import { wrapBoardHtml } from "./week-wrap-html-board";
import { wrapNflHtml } from "./week-wrap-html-nfl";
import { wrapResultsHtml } from "./week-wrap-html-results";
import {
  escapeHtml,
  paragraphs,
  TABLE,
  WRAP_BG,
  WRAP_FONT,
  WRAP_GOLD,
  WRAP_TEXT,
} from "./week-wrap-html-util";
import type { WeekWrapEmailParts } from "./week-wrap-rich-types";
import { touchdownEmailHtml } from "./week-wrap-touchdown-html";

function boardCta(url: string): string {
  const href = escapeHtml(url);
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 8px;"><tr><td bgcolor="${WRAP_GOLD}" style="border-radius:8px;"><a href="${href}" style="display:block;padding:12px 20px;font-family:${WRAP_FONT};font-size:15px;font-weight:bold;color:${WRAP_BG};text-decoration:none;">Open the board</a></td></tr></table>`;
}

/**
 * Section order: intro · Won · Lost · Eliminated (only if any) · Pool
 * leaderboard · NFL divisions · drama / touchdown video / board link.
 * The quiet prefs footer is added by the caller.
 */
export function weekWrapBodyHtml(parts: WeekWrapEmailParts): string {
  const { blocks, facts } = parts;
  const out = [`<div style="margin:0 0 16px;">${paragraphs(parts.intro)}</div>`];
  out.push(wrapResultsHtml(facts.players, blocks));
  if (blocks.board) {
    out.push(wrapBoardHtml(facts.board, facts.players));
    out.push(wrapNflHtml(facts.nfl));
  }
  if (parts.drama) out.push(paragraphs(parts.drama));
  out.push(touchdownEmailHtml(parts.clip));
  if (blocks.board) out.push(boardCta(facts.boardUrl));
  return out.filter(Boolean).join("");
}

/** Full document (skips the generic stadium wrapper). `bodyHtml` already has the footer. */
export function weekWrapEmailDocument(subject: string, bodyHtml: string): string {
  const footer = bodyHtml.includes("account/notifications") ? "" : gameEmailFooterHtml();
  return `<!doctype html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><meta name="color-scheme" content="dark" /><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${WRAP_BG};color:${WRAP_TEXT};">
<table ${TABLE} bgcolor="${WRAP_BG}" style="background:${WRAP_BG};"><tr><td align="center" style="padding:24px 12px;">
<table ${TABLE} style="max-width:600px;">
<tr><td style="padding:0 0 4px;font-family:${WRAP_FONT};font-size:20px;font-weight:bold;letter-spacing:0.08em;color:${WRAP_GOLD};">SURVIVE SUNDAY</td></tr>
<tr><td style="padding:0 0 16px;font-family:${WRAP_FONT};font-size:18px;color:${WRAP_TEXT};">${escapeHtml(subject)}</td></tr>
<tr><td style="font-family:${WRAP_FONT};color:${WRAP_TEXT};">${bodyHtml}${footer}</td></tr>
</table>
</td></tr></table>
</body>
</html>`;
}

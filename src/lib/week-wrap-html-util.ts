/** Email-safe building blocks: tables + inline styles only. */

import { PUBLIC_APP_ORIGIN } from "./invite-link";
import { localHelmetSrc } from "./team-helmets";

export const WRAP_BG = "#0b0e12";
export const WRAP_PANEL = "#141922";
export const WRAP_LINE = "#262d38";
export const WRAP_TEXT = "#f2f4f7";
export const WRAP_MUTED = "#9aa5b5";
export const WRAP_GOLD = "#e8c547";
export const WRAP_WIN = "#4ade80";
export const WRAP_LOSS = "#f87171";
export const WRAP_FONT = "Helvetica,Arial,sans-serif";

export const TABLE = `role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"`;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Absolute lowercase helmet URL, e.g. https://…/helmets/sf.png (WAS, not WSH). */
export function helmetUrl(abbr: string): string {
  return `${PUBLIC_APP_ORIGIN}${localHelmetSrc(abbr)}`;
}

export function helmetImg(abbr: string, size = 24): string {
  const alt = escapeHtml(abbr.trim().toUpperCase());
  return `<img src="${escapeHtml(helmetUrl(abbr))}" width="${size}" height="${size}" alt="${alt}" style="display:block;border:0;outline:none;width:${size}px;height:${size}px;" />`;
}

/** Titled card. Callers pass `<tr>` rows for the inner table. */
export function wrapSection(title: string, rowsHtml: string): string {
  const head = `<tr><td style="padding:0 0 8px;font-family:${WRAP_FONT};font-size:12px;font-weight:bold;letter-spacing:0.08em;text-transform:uppercase;color:${WRAP_GOLD};">${escapeHtml(title)}</td></tr>`;
  const body = `<tr><td style="background:${WRAP_PANEL};border:1px solid ${WRAP_LINE};border-radius:8px;padding:8px 12px;"><table ${TABLE}>${rowsHtml}</table></td></tr>`;
  return `<table ${TABLE} style="margin:0 0 20px;">${head}${body}</table>`;
}

export function mutedRow(text: string, colspan = 3): string {
  return `<tr><td colspan="${colspan}" style="padding:6px 0;font-family:${WRAP_FONT};font-size:14px;color:${WRAP_MUTED};">${escapeHtml(text)}</td></tr>`;
}

export function paragraphs(text: string, color = WRAP_TEXT): string {
  return text
    .split("\n")
    .map(
      (line) =>
        `<p style="margin:0 0 8px;font-family:${WRAP_FONT};font-size:15px;line-height:22px;color:${color};">${escapeHtml(line) || "&nbsp;"}</p>`
    )
    .join("");
}

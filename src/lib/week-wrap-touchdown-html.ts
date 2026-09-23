import type { TouchdownClip } from "./week-wrap-touchdown";

export const TOUCHDOWN_SMS_MAX = 480;

export function emailTextWithTouchdown(body: string, clip: TouchdownClip | null): string {
  if (!clip) return body;
  return `${body}\n${clip.title}\n${clip.watchUrl}`;
}

export function smsWithTouchdown(body: string, clip: TouchdownClip | null): string {
  if (!clip) return body;
  const next = `${body}\n${clip.shortUrl}`;
  return next.length <= TOUCHDOWN_SMS_MAX ? next : body;
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function touchdownEmailHtml(clip: TouchdownClip | null): string {
  if (!clip) return "";
  const alt = escapeAttr(clip.title);
  const href = escapeAttr(clip.watchUrl);
  const src = escapeAttr(clip.thumbUrl);
  return `<p style="margin:12px 0 8px;"><a href="${href}"><img src="${src}" alt="${alt}" width="320" style="max-width:100%;height:auto;border:0;" /></a></p><p style="margin:0 0 8px;"><a href="${href}">${alt}</a></p>`;
}

import type { NotifyContent } from "./notification-copy";
import { PUBLIC_APP_ORIGIN } from "./invite-link";
import { isWrapLoss } from "./week-wrap-players";
import {
  emailTextWithTouchdown,
  smsWithTouchdown,
  touchdownEmailHtml,
  type TouchdownClip,
} from "./week-wrap-touchdown";
import type {
  WeekWrapBlocks,
  WeekWrapFacts,
  WeekWrapPlayer,
  WeekWrapTone,
} from "./week-wrap-types";

export const WEEK_WRAP_BOARD_URL = `${PUBLIC_APP_ORIGIN}/standings`;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function names(list: string[]): string {
  return list.length ? list.join(", ") : "nobody";
}

export function dramaLine(players: WeekWrapPlayer[]): string {
  const out = players.filter((player) => player.eliminatedThisWeek);
  if (out.length === 1) {
    return `${out[0]!.nickname} is out. The group chat may now be unbearable.`;
  }
  if (out.length > 1) {
    return `${out.length} gone this week. Survive Sunday does not do gentle.`;
  }
  if (players.some((player) => isWrapLoss(player.teamAbbr, player.result))) {
    return "Losses, mulligans, nobody out. The couch stays loud.";
  }
  if (
    players.length > 0 &&
    players.every((player) => (player.result ?? "").toLowerCase() === "win")
  ) {
    return "Clean sheet. Suspicious. Enjoy it.";
  }
  return "Another week in the books. The board does not care about your feelings.";
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

function pickPhrase(player: WeekWrapPlayer): string {
  if (!player.teamAbbr || player.teamAbbr === "MISS") {
    return `${player.nickname} no pick`;
  }
  const result = (player.result ?? "").toLowerCase();
  if (result === "win") return `${player.nickname} ${player.teamAbbr} won`;
  if (result === "loss" || result === "push" || result === "missed") {
    return `${player.nickname} ${player.teamAbbr} lost`;
  }
  return `${player.nickname} ${player.teamAbbr} pending`;
}

function sectionLines(facts: WeekWrapFacts, blocks: WeekWrapBlocks): string[] {
  const lines: string[] = [];
  if (blocks.roster) lines.push(...rosterLines(facts));
  if (blocks.picks) {
    const picks = facts.players.filter((player) => player.teamAbbr);
    lines.push(
      picks.length ? `Picks: ${picks.map(pickPhrase).join("; ")}` : "Picks: none yet"
    );
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

function emailText(opts: {
  tone: WeekWrapTone;
  blocks: WeekWrapBlocks;
  facts: WeekWrapFacts;
}): string {
  if (opts.tone === "short") return weekWrapShortText(opts.facts, opts.blocks);
  const intro =
    opts.tone === "funny"
      ? `Week ${opts.facts.weekNumber} is over. Here is the damage.`
      : `Week ${opts.facts.weekNumber} wrap.`;
  const lines = [intro, ...sectionLines(opts.facts, opts.blocks)];
  if (opts.tone === "funny" && opts.blocks.drama) {
    lines.push(dramaLine(opts.facts.players));
  }
  return lines.join("\n");
}

function subjectFor(tone: WeekWrapTone, weekNumber: number): string {
  if (tone === "funny") return `Week ${weekNumber} wrap — the board has opinions`;
  if (tone === "short") return `Wk ${weekNumber} wrap`;
  return `Week ${weekNumber} wrap`;
}

function toHtml(text: string): string {
  return text
    .split("\n")
    .map((line) => `<p style="margin:0 0 8px;">${escapeHtml(line) || "&nbsp;"}</p>`)
    .join("");
}

/** Template copy. SMS is always the short facts body. No live model. */
export function weekWrapContent(opts: {
  tone: WeekWrapTone;
  blocks: WeekWrapBlocks;
  facts: WeekWrapFacts;
  emailOverride?: string;
  smsOverride?: string;
  touchdown?: TouchdownClip | null;
}): NotifyContent {
  const email = (opts.emailOverride ?? "").trim();
  const sms = (opts.smsOverride ?? "").trim();
  const base = email || emailText(opts);
  const clip = opts.touchdown ?? null;
  return {
    subject: subjectFor(opts.tone, opts.facts.weekNumber),
    text: emailTextWithTouchdown(base, clip),
    htmlBody: toHtml(base) + touchdownEmailHtml(clip),
    smsBody: smsWithTouchdown(sms || weekWrapShortText(opts.facts, opts.blocks), clip),
  };
}

import { isDemoRecipient } from "./notification-gates";
import {
  contactFor,
  resolveChannels,
  type NotifyPerson,
} from "./notify-channels";

export type NoticePerson = NotifyPerson & {
  userId: string;
  nickname: string;
};

export type NoticeCounts = {
  email: number;
  sms: number;
  skippedOff: number;
  nicknames: string[];
};

export const EMPTY_NOTICE: NoticeCounts = {
  email: 0,
  sms: 0,
  skippedOff: 0,
  nicknames: [],
};

/** Preference counts for a confirm. Ignores dry-run and the allowlist. */
export function noticeCounts(people: NoticePerson[], type: string): NoticeCounts {
  const seen = new Set<string>();
  let email = 0;
  let sms = 0;
  let skippedOff = 0;
  const nicknames: string[] = [];
  for (const person of people) {
    if (seen.has(person.userId)) continue;
    seen.add(person.userId);
    const channels = resolveChannels(person, "game", undefined, type);
    if (channels.length === 0) {
      skippedOff += 1;
      continue;
    }
    let reached = false;
    const mail = contactFor(person, "email");
    if (channels.includes("email") && mail && !isDemoRecipient(mail)) {
      email += 1;
      reached = true;
    }
    if (channels.includes("sms") && contactFor(person, "sms")) {
      sms += 1;
      reached = true;
    }
    if (reached) nicknames.push(person.nickname);
  }
  nicknames.sort((a, b) =>
    a.localeCompare(b, "en-CA", { sensitivity: "base" })
  );
  return { email, sms, skippedOff, nicknames };
}

export function remindConfirmLine(
  counts: Pick<NoticeCounts, "email" | "sms" | "skippedOff">
): string {
  return `Email ${counts.email} · SMS ${counts.sms} · ${counts.skippedOff} skipped (notifications off)`;
}

export function wrapConfirmLine(
  weekNumber: number,
  counts: Pick<NoticeCounts, "email" | "sms">
): string {
  return `Send Week ${weekNumber} wrap to ${counts.email} email · ${counts.sms} SMS now? Auto-send will be cancelled.`;
}

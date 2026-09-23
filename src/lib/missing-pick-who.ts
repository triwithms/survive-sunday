import { PUBLIC_APP_ORIGIN } from "./invite-link";
import type { NoticeCounts } from "./notice-audience";
import { isMissingPickReminderWindow } from "./notification-gates";
import { shouldApplyMissedPick } from "./pool-rules";
import { isPlayerSeat } from "./roles";

export const MISSING_PICK_AUDIT = "missing_pick_reminders";

/** Cron keeps the 24h window. Admin list/send does not. */
export type RemindMode = "cron" | "admin";

export type RemindSeat = {
  membershipId: string;
  nickname: string;
  status: string;
  role: string;
  isParticipant?: boolean;
  playingFromWeek?: number | null;
  userId: string;
  email: string | null;
  phoneE164: string | null;
  notifyPref: string | null;
};

export type MissingPickBlank = {
  membershipId: string;
  nickname: string;
};

export type MissingPickWeekView = {
  weekId: string;
  weekNumber: number;
  lockLabel: string;
  blanks: MissingPickBlank[];
  plan: NoticeCounts;
};

export type MissingPickPanelData = {
  pickUrl: string;
  weeks: MissingPickWeekView[];
};

export function weekAllowsMissingPickRemind(opts: {
  mode: RemindMode;
  status: string;
  lockAt: Date;
  now: Date;
}): boolean {
  if (opts.status !== "open") return false;
  if (!(opts.lockAt.getTime() > opts.now.getTime())) return false;
  if (opts.mode === "admin") return true;
  return isMissingPickReminderWindow(opts.lockAt, opts.now);
}

/** Player seats who still owe a pick. Eliminated seats are not reminded. */
export function seatsMissingPick(
  seats: RemindSeat[],
  weekNumber: number,
  picked: ReadonlySet<string>
): RemindSeat[] {
  return seats
    .filter((seat) => {
      if (!isPlayerSeat(seat)) return false;
      if (!shouldApplyMissedPick(seat, weekNumber)) return false;
      return !picked.has(seat.membershipId);
    })
    .sort((a, b) =>
      a.nickname.localeCompare(b.nickname, "en-CA", { sensitivity: "base" })
    );
}

/** A Pick row at send time means do not notify. */
export function remindAfterRecheck(pickExistsNow: boolean): boolean {
  return !pickExistsNow;
}

export function lockLabelToronto(lockAt: Date): string {
  return lockAt.toLocaleString("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Toronto",
  });
}

export function missingPickChatText(opts: {
  weekNumber: number;
  nicknames: string[];
  appUrl?: string;
}): string {
  const url = opts.appUrl ?? `${PUBLIC_APP_ORIGIN}/pick`;
  const names = [...opts.nicknames].sort((a, b) =>
    a.localeCompare(b, "en-CA", { sensitivity: "base" })
  );
  return `No Week ${opts.weekNumber} pick yet\n${url}\n\n${names.join("\n")}`.trim();
}

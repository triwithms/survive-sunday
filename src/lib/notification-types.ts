/** Alert types each signed-in user can turn on or off. */

export const NOTIFICATION_TYPES = [
  "missingPickReminder",
  "pickConfirmed",
  "resultsGraded",
  "eliminationMulligan",
  "poolAnnouncements",
  "scoreUpdates",
  "injuryNotes",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type NotificationPrefs = Record<NotificationType, boolean> & {
  pushEnabled: boolean;
};

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  missingPickReminder: true,
  pickConfirmed: true,
  resultsGraded: true,
  eliminationMulligan: true,
  poolAnnouncements: true,
  scoreUpdates: false,
  injuryNotes: false,
  pushEnabled: false,
};

export const CORE_NOTIFICATION_TYPES: NotificationType[] = [
  "missingPickReminder",
  "pickConfirmed",
  "resultsGraded",
  "eliminationMulligan",
  "poolAnnouncements",
];

export const OPTIONAL_NOTIFICATION_TYPES: NotificationType[] = [
  "scoreUpdates",
  "injuryNotes",
];

export const NOTIFICATION_COPY: Record<
  NotificationType,
  { label: string; hint: string }
> = {
  missingPickReminder: {
    label: "Missing pick reminder",
    hint: "Before lock, if you still have no pick. Email, plus a text to your cell.",
  },
  pickConfirmed: {
    label: "Pick saved or changed",
    hint: "A confirmation when you submit or change your pick.",
  },
  resultsGraded: {
    label: "Results",
    hint: "When your pick wins or loses, or the week is graded.",
  },
  eliminationMulligan: {
    label: "You’re out / mulligan used",
    hint: "If your mulligan burns or you are eliminated.",
  },
  poolAnnouncements: {
    label: "Pool notes",
    hint: "Important messages from the commissioner.",
  },
  scoreUpdates: {
    label: "Live score updates",
    hint: "Optional and noisier — updates while your pick’s game is on.",
  },
  injuryNotes: {
    label: "Injury notes",
    hint: "Optional notes when a lineup looks shaky. Off unless you turn it on.",
  },
};

export function isNotificationType(value: unknown): value is NotificationType {
  return (
    typeof value === "string" &&
    (NOTIFICATION_TYPES as readonly string[]).includes(value)
  );
}

export function mergeNotificationPrefs(
  row?: Partial<NotificationPrefs> | null
): NotificationPrefs {
  return {
    ...DEFAULT_NOTIFICATION_PREFS,
    ...Object.fromEntries(
      NOTIFICATION_TYPES.map((key) => [
        key,
        typeof row?.[key] === "boolean"
          ? row[key]
          : DEFAULT_NOTIFICATION_PREFS[key],
      ])
    ),
    pushEnabled:
      typeof row?.pushEnabled === "boolean"
        ? row.pushEnabled
        : DEFAULT_NOTIFICATION_PREFS.pushEnabled,
  };
}

export function parsePreferencePatch(body: unknown):
  | { ok: true; prefs: NotificationPrefs }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid preferences" };
  }
  const input = body as Record<string, unknown>;
  const next = { ...DEFAULT_NOTIFICATION_PREFS };
  for (const key of NOTIFICATION_TYPES) {
    if (key in input) {
      if (typeof input[key] !== "boolean") {
        return { ok: false, error: `“${NOTIFICATION_COPY[key].label}” must be on or off` };
      }
      next[key] = input[key];
    }
  }
  if ("pushEnabled" in input) {
    if (typeof input.pushEnabled !== "boolean") {
      return { ok: false, error: "Phone alerts must be on or off" };
    }
    next.pushEnabled = input.pushEnabled;
  }
  return { ok: true, prefs: next };
}

export function isTypeEnabled(
  prefs: NotificationPrefs | null | undefined,
  type: NotificationType
): boolean {
  return mergeNotificationPrefs(prefs)[type] === true;
}

const DEMO_SUFFIX = "@survivesunday.demo";

export function isDemoRecipient(email?: string | null): boolean {
  return (email ?? "").trim().toLowerCase().endsWith(DEMO_SUFFIX);
}

/** Password-reset codes are account recovery — never gated by these prefs. */
export function isAccountRecoveryChannel(purpose?: string | null): boolean {
  return purpose === "password_reset";
}

export function shouldSendPoolEmail(opts: {
  email?: string | null;
  prefs?: NotificationPrefs | null;
  type: NotificationType;
}): { send: boolean; reason: string } {
  const email = (opts.email ?? "").trim();
  if (!email) return { send: false, reason: "no-email" };
  if (isDemoRecipient(email)) return { send: false, reason: "demo-email" };
  if (!isTypeEnabled(opts.prefs, opts.type)) {
    return { send: false, reason: "pref-off" };
  }
  return { send: true, reason: "ok" };
}

export function shouldSendMissingPickSms(opts: {
  phoneE164?: string | null;
  prefs?: NotificationPrefs | null;
}): { send: boolean; reason: string } {
  const phone = (opts.phoneE164 ?? "").trim();
  if (!phone) return { send: false, reason: "no-phone" };
  if (!isTypeEnabled(opts.prefs, "missingPickReminder")) {
    return { send: false, reason: "pref-off" };
  }
  return { send: true, reason: "ok" };
}

export const MISSING_PICK_REMIND_WINDOW_MS = 24 * 60 * 60 * 1000;

/** True when lock is in the future and within the reminder window. */
export function isMissingPickReminderWindow(
  lockAt: Date | string | number,
  now: Date = new Date()
): boolean {
  const lock = lockAt instanceof Date ? lockAt : new Date(lockAt);
  if (Number.isNaN(lock.getTime())) return false;
  const ms = lock.getTime() - now.getTime();
  return ms > 0 && ms <= MISSING_PICK_REMIND_WINDOW_MS;
}

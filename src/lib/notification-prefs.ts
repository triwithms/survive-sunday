/**
 * Account → Notification preferences.
 * One row per membership (user-in-this-pool). Missing rows use defaults.
 * Password-reset OTP is transactional and is never gated here.
 */

export const NOTIFICATION_TYPES = [
  "missing_pick_reminder",
  "pick_confirmed",
  "results_graded",
  "mulligan_eliminated",
  "pool_announcements",
  "live_scores",
  "injury_notes",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/** Transactional messages that must ignore player toggles. */
export const UNGATED_MESSAGE_TYPES = ["password_reset"] as const;
export type UngatedMessageType = (typeof UNGATED_MESSAGE_TYPES)[number];

export const NOTIFICATION_DEFAULTS = {
  missing_pick_reminder: true,
  pick_confirmed: true,
  results_graded: true,
  mulligan_eliminated: true,
  pool_announcements: true,
  live_scores: false,
  injury_notes: false,
} as const satisfies Record<NotificationType, boolean>;

export type NotificationPrefs = Record<NotificationType, boolean>;

export const NOTIFICATION_FIELD = {
  missing_pick_reminder: "missingPickReminder",
  pick_confirmed: "pickConfirmed",
  results_graded: "resultsGraded",
  mulligan_eliminated: "mulliganEliminated",
  pool_announcements: "poolAnnouncements",
  live_scores: "liveScores",
  injury_notes: "injuryNotes",
} as const satisfies Record<NotificationType, string>;

export type NotificationField = (typeof NOTIFICATION_FIELD)[NotificationType];

export const NOTIFICATION_CATALOG: {
  type: NotificationType;
  field: NotificationField;
  label: string;
  hint: string;
}[] = [
  {
    type: "missing_pick_reminder",
    field: "missingPickReminder",
    label: "Missing pick reminder",
    hint: "Text or email if you haven’t picked before lock.",
  },
  {
    type: "pick_confirmed",
    field: "pickConfirmed",
    label: "Pick confirmed / changed",
    hint: "Confirm when you submit or change a pick.",
  },
  {
    type: "results_graded",
    field: "resultsGraded",
    label: "Results graded",
    hint: "When your pick is marked win or loss.",
  },
  {
    type: "mulligan_eliminated",
    field: "mulliganEliminated",
    label: "Mulligan / eliminated",
    hint: "When you burn the mulligan or you’re out.",
  },
  {
    type: "pool_announcements",
    field: "poolAnnouncements",
    label: "Pool announcements",
    hint: "Commissioner notes for the group.",
  },
  {
    type: "live_scores",
    field: "liveScores",
    label: "Live scores",
    hint: "Score updates while games are on. Off by default.",
  },
  {
    type: "injury_notes",
    field: "injuryNotes",
    label: "Injury notes",
    hint: "Injury-report notes for your pick. Off by default.",
  },
];

const TYPE_BY_FIELD = Object.fromEntries(
  NOTIFICATION_TYPES.map((type) => [NOTIFICATION_FIELD[type], type])
) as Record<NotificationField, NotificationType>;

export function isNotificationType(value: unknown): value is NotificationType {
  return (
    typeof value === "string" &&
    (NOTIFICATION_TYPES as readonly string[]).includes(value)
  );
}

export function isUngatedMessageType(value: unknown): value is UngatedMessageType {
  return (
    typeof value === "string" &&
    (UNGATED_MESSAGE_TYPES as readonly string[]).includes(value)
  );
}

export function defaultNotificationPrefs(): NotificationPrefs {
  return { ...NOTIFICATION_DEFAULTS };
}

export function mergeNotificationPrefs(
  stored?: Partial<Record<NotificationField, boolean | null>> | null
): NotificationPrefs {
  const prefs = defaultNotificationPrefs();
  if (!stored) return prefs;
  for (const type of NOTIFICATION_TYPES) {
    const field = NOTIFICATION_FIELD[type];
    const value = stored[field];
    if (typeof value === "boolean") prefs[type] = value;
  }
  return prefs;
}

export function prefsToFields(prefs: NotificationPrefs): Record<NotificationField, boolean> {
  return {
    missingPickReminder: prefs.missing_pick_reminder,
    pickConfirmed: prefs.pick_confirmed,
    resultsGraded: prefs.results_graded,
    mulliganEliminated: prefs.mulligan_eliminated,
    poolAnnouncements: prefs.pool_announcements,
    liveScores: prefs.live_scores,
    injuryNotes: prefs.injury_notes,
  };
}

/**
 * Accept camelCase fields from the Account sheet, or snake_case types.
 * Unknown keys are ignored. Values must be boolean.
 */
export function parsePrefPatch(body: unknown): {
  ok: true;
  patch: Partial<Record<NotificationField, boolean>>;
} | { ok: false; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Invalid preferences" };
  }
  const source =
    "prefs" in body && body.prefs && typeof body.prefs === "object"
      ? (body.prefs as Record<string, unknown>)
      : (body as Record<string, unknown>);

  const patch: Partial<Record<NotificationField, boolean>> = {};
  let saw = false;
  for (const [key, value] of Object.entries(source)) {
    if (key === "prefs") continue;
    let field: NotificationField | undefined;
    if (key in TYPE_BY_FIELD) {
      field = key as NotificationField;
    } else if (isNotificationType(key)) {
      field = NOTIFICATION_FIELD[key];
    }
    if (!field) continue;
    if (typeof value !== "boolean") {
      return { ok: false, error: `“${key}” must be on or off` };
    }
    patch[field] = value;
    saw = true;
  }
  if (!saw) return { ok: false, error: "No notification toggles to save" };
  return { ok: true, patch };
}

export function isNotificationEnabled(
  prefs: NotificationPrefs,
  type: NotificationType
): boolean {
  return prefs[type] === true;
}

/** Pool email/SMS must check prefs. Password reset must not. */
export function shouldSendMessage(args: {
  type: NotificationType | UngatedMessageType | string;
  prefs?: NotificationPrefs | null;
}): boolean {
  if (isUngatedMessageType(args.type)) return true;
  if (!isNotificationType(args.type)) return false;
  const prefs = args.prefs ?? defaultNotificationPrefs();
  return isNotificationEnabled(prefs, args.type);
}

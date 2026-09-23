export const CORE_NOTIFICATION_TYPES = [
  "missingPickReminder",
  "pickConfirmed",
  "resultsGraded",
  "weekWrap",
  "eliminationMulligan",
  "poolAnnouncements",
] as const;

export const OPTIONAL_NOTIFICATION_TYPES = [
  "scoreUpdates",
  "injuryNotes",
] as const;

export const NOTIFICATION_COPY = {
  missingPickReminder: {
    label: "Missing pick reminder",
    hint: "Before lock, if you still have no pick.",
  },
  pickConfirmed: {
    label: "Pick saved or changed",
    hint: "A confirmation when you submit or change your pick.",
  },
  resultsGraded: {
    label: "Results",
    hint: "When your pick wins or loses, or the week is graded.",
  },
  weekWrap: {
    label: "Week wrap",
    hint: "The next morning after that week’s last game is final.",
  },
  eliminationMulligan: {
    label: "You’re out / mulligan used",
    hint: "If your mulligan burns or you are eliminated.",
  },
  poolAnnouncements: {
    label: "Pool notes",
    hint: "Important messages from the administrator.",
  },
  scoreUpdates: {
    label: "Live score updates",
    hint: "Optional and noisier — updates while your pick’s game is on.",
  },
  injuryNotes: {
    label: "Injury notes",
    hint: "Optional notes when a lineup looks shaky.",
  },
} as const;

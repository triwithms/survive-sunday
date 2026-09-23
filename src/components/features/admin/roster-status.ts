const LABELS = {
  undefeated: "Alive",
  one_loss: "One loss",
  eliminated: "Out",
} as const;

export type RosterLifeStatus = keyof typeof LABELS;

export function rosterStatusLabel(status: string): string | null {
  if (status in LABELS) return LABELS[status as RosterLifeStatus];
  return null;
}

export function isRosterLifeStatus(status: string): status is RosterLifeStatus {
  return status in LABELS;
}

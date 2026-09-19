export type PickSaveInput = {
  ok: boolean;
  error?: string | null;
  locked?: boolean;
};

export type PickSaveOutcome =
  | { kind: "ok"; changed: boolean }
  | { kind: "locked"; message: string }
  | { kind: "error"; message: string };

const LOCKED_FALLBACK = "Week is locked — picks cannot change";

export function applyPickSave(
  data: PickSaveInput,
  currentPick: string | null,
  abbr: string
): PickSaveOutcome {
  if (!data.ok) {
    if (data.locked || /locked/i.test(data.error || "")) {
      return { kind: "locked", message: data.error || LOCKED_FALLBACK };
    }
    return { kind: "error", message: data.error || "Could not save pick" };
  }
  return { kind: "ok", changed: Boolean(currentPick && currentPick !== abbr) };
}

export function pickSavedMessage(changed: boolean) {
  return changed
    ? "Pick updated — heading to Selections…"
    : "Locked in — heading to Selections…";
}

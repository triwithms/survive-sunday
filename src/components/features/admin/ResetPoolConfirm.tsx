"use client";

import { Button } from "@/components/ui";
import { RESET_POOL_CONFIRM } from "@/lib/constants";

export function ResetPoolConfirm({
  typed,
  busy,
  onTyped,
  onReset,
  onCancel,
}: {
  typed: string;
  busy: boolean;
  onTyped: (value: string) => void;
  onReset: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-crimson-400/40 p-3">
      <p className="text-sm text-[var(--text-primary)]">
        This cannot be undone. Type{" "}
        <span className="font-mono font-semibold">{RESET_POOL_CONFIRM}</span>{" "}
        to continue.
      </p>
      <input
        value={typed}
        onChange={(e) => onTyped(e.target.value.toUpperCase())}
        autoComplete="off"
        placeholder={RESET_POOL_CONFIRM}
        aria-label="Type RESET to confirm"
        className="font-mono tracking-widest"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Button
          variant="danger"
          className="w-full"
          disabled={busy || typed.trim() !== RESET_POOL_CONFIRM}
          onClick={onReset}
        >
          {busy ? "Resetting…" : "Yes, reset the pool"}
        </Button>
        <Button variant="secondary" className="w-full" disabled={busy} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

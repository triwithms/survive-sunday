"use client";

import { Button } from "@/components/ui";

export function DeletePoolConfirm({
  poolName,
  typed,
  busy,
  ready,
  onTyped,
  onDelete,
  onCancel,
}: {
  poolName: string;
  typed: string;
  busy: boolean;
  ready: boolean;
  onTyped: (value: string) => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-crimson-400/40 p-3">
      <p className="text-sm text-[var(--text-primary)]">
        This cannot be undone. Type{" "}
        <span className="font-mono font-semibold">{poolName}</span> to delete
        this pool.
      </p>
      <input
        value={typed}
        onChange={(e) => onTyped(e.target.value)}
        autoComplete="off"
        spellCheck={false}
        placeholder={poolName}
        aria-label="Type the pool name to confirm"
        data-testid="delete-pool-confirm"
        className="font-mono"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Button
          variant="danger"
          className="w-full"
          disabled={busy || !ready}
          onClick={onDelete}
        >
          {busy ? "Deleting…" : "Yes, delete this pool"}
        </Button>
        <Button variant="secondary" className="w-full" disabled={busy} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

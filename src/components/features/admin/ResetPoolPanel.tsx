"use client";

import { Button, Card } from "@/components/ui";
import { ResetPoolConfirm } from "./ResetPoolConfirm";
import { ResetPoolPreview } from "./ResetPoolPreview";
import { useResetPool } from "./use-reset-pool";

export function ResetPoolPanel() {
  const reset = useResetPool();
  return (
    <Card as="section" className="p-4 space-y-3 border border-crimson-400/30">
      <div>
        <h2 className="font-semibold text-crimson-400">Reset pool</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Optional. Reset when you want a clean board before importing real
          Week 1 picks. It does{" "}
          <strong className="text-[var(--text-primary)]">not</strong> wipe
          sign-in settings, the schedule, or your commissioner account.
        </p>
      </div>
      {reset.preview ? <ResetPoolPreview preview={reset.preview} /> : null}
      {!reset.showConfirm ? (
        <Button
          variant="danger"
          className="w-full"
          disabled={reset.busy}
          onClick={() => {
            reset.setShowConfirm(true);
            reset.setErr("");
            reset.setMsg("");
          }}
        >
          Start reset…
        </Button>
      ) : (
        <ResetPoolConfirm
          typed={reset.typed}
          busy={reset.busy}
          onTyped={reset.setTyped}
          onReset={() => void reset.runReset()}
          onCancel={() => {
            reset.setShowConfirm(false);
            reset.setTyped("");
          }}
        />
      )}
      {reset.msg ? (
        <p className="text-sm text-field-400" role="status">{reset.msg}</p>
      ) : null}
      {reset.err ? (
        <p className="text-sm text-crimson-400" role="alert">{reset.err}</p>
      ) : null}
    </Card>
  );
}

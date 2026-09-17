"use client";

import { Button, Card } from "@/components/ui";
import { useAdminPost } from "./use-admin-post";

const ACTIONS = [
  { action: "reopen", label: "Reopen week for picks", variant: "primary" },
  { action: "unlock", label: "Unlock (testing)", variant: "secondary" },
  { action: "lock_now", label: "Lock now + missed picks", variant: "secondary" },
  { action: "clear_override", label: "Clear override", variant: "secondary" },
] as const;

export function AdminLockPanel({ weekNumber }: { weekNumber: number }) {
  const { msg, busy, call } = useAdminPost();
  return (
    <Card as="section" className="p-4 space-y-2">
      <h2 className="font-semibold">Lock controls</h2>
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((item) => (
          <Button
            key={item.action}
            variant={item.variant}
            disabled={busy}
            onClick={() =>
              call("/api/admin/lock", { weekNumber, action: item.action })
            }
          >
            {item.label}
          </Button>
        ))}
      </div>
      <p className="text-xs text-[var(--text-muted)]">
        Reopen: sets lockAt to now+7 days, clears override +
        missedPicksAppliedAt, removes missed picks and undoes those losses.
        Real/imported picks stay.
      </p>
      {msg ? (
        <pre className="card-glass p-3 text-xs overflow-x-auto text-field-400">
          {msg}
        </pre>
      ) : null}
    </Card>
  );
}

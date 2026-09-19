"use client";

import { Button } from "@/components/ui";
import { useAdminPost } from "./use-admin-post";

export function RemoveSeatButton({
  membershipId,
  nickname,
}: {
  membershipId: string;
  nickname: string;
}) {
  const { msg, busy, call } = useAdminPost();
  return (
    <div className="space-y-2">
      <p className="text-sm text-[var(--text-muted)]">
        Drops {nickname} and their picks from the pool. Cannot be undone here.
      </p>
      <Button
        variant="danger"
        className="w-full min-h-11"
        disabled={busy}
        onClick={() => {
          if (confirm(`Remove ${nickname} from the pool?`)) {
            call("/api/admin/remove-player", { membershipId });
          }
        }}
      >
        {busy ? "Removing…" : `Remove ${nickname}`}
      </Button>
      {msg ? (
        <p className="text-sm text-field-400" role="status">
          {msg}
        </p>
      ) : null}
    </div>
  );
}

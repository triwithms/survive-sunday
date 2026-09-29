"use client";

import { Button, Card } from "@/components/ui";
import { DeletePoolConfirm } from "./DeletePoolConfirm";
import { useDeletePool } from "./use-delete-pool";

export function DeletePoolPanel({
  poolId,
  poolName,
}: {
  poolId: string;
  poolName: string;
}) {
  const del = useDeletePool(poolId, poolName);
  return (
    <Card as="section" className="p-4 space-y-3 border border-crimson-400/30">
      <div>
        <h2 className="font-semibold text-crimson-400">Delete pool</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Removes this pool only: its players, picks, weeks, join link, and
          admin notes. Other pools stay. If you still belong to a pool, you
          land there (the family pool when you still have it). If this is your
          only pool, you are signed out. Email and password stay.
        </p>
      </div>
      {!del.showConfirm ? (
        <Button
          variant="danger"
          className="w-full"
          disabled={del.busy}
          onClick={() => {
            del.setShowConfirm(true);
            del.setErr("");
          }}
        >
          Start delete…
        </Button>
      ) : (
        <DeletePoolConfirm
          poolName={poolName}
          typed={del.typed}
          busy={del.busy}
          ready={del.ready}
          onTyped={del.setTyped}
          onDelete={() => void del.runDelete()}
          onCancel={() => {
            del.setShowConfirm(false);
            del.setTyped("");
            del.setErr("");
          }}
        />
      )}
      {del.err ? (
        <p className="text-sm text-crimson-400" role="alert">
          {del.err}
        </p>
      ) : null}
    </Card>
  );
}

"use client";

import { Button, Card } from "@/components/ui";
import { useAdminPost } from "./use-admin-post";

export function AdminGradePanel({
  weekNumber,
  games,
}: {
  weekNumber: number;
  games: { id: string; status: string }[];
}) {
  const { msg, busy, call } = useAdminPost();
  const finalCount = games.filter((g) => g.status === "final").length;
  return (
    <Card as="section" className="p-4 space-y-2">
      <h2 className="font-semibold">Scores & grading</h2>
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={busy}
          onClick={() => call("/api/admin/simulate", { weekNumber })}
        >
          Simulate remaining scores
        </Button>
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() =>
            call("/api/admin/grade", { weekNumber, applyMissed: true })
          }
        >
          Force grade + missed
        </Button>
      </div>
      <p className="text-xs text-[var(--text-muted)]">
        {finalCount}/{games.length} games final
      </p>
      {msg ? (
        <p className="text-sm text-field-400 break-words" role="status">
          {msg}
        </p>
      ) : null}
    </Card>
  );
}

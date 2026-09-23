"use client";

import { Card } from "@/components/ui";
import type { MissingPickPanelData } from "@/lib/missing-pick-who";
import { MissingPickWeek } from "./MissingPickWeek";

export function MissingPickPanel({ data }: { data: MissingPickPanelData }) {
  return (
    <Card
      as="section"
      id="missing-picks"
      className="space-y-3 p-4"
      data-testid="missing-picks"
    >
      <div>
        <h2 className="font-semibold">Missing picks</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Who still has no pick on the open week. Send uses each friend’s
          notification preference. The daily job only runs in the last 24
          hours before lock.
        </p>
      </div>
      {data.weeks.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No open week right now.</p>
      ) : (
        data.weeks.map((week) => (
          <MissingPickWeek key={week.weekId} week={week} pickUrl={data.pickUrl} />
        ))
      )}
    </Card>
  );
}

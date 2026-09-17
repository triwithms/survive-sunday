"use client";

import { Button, Card } from "@/components/ui";
import { EnterPickFields } from "./EnterPickFields";
import { useEnterPick } from "./use-enter-pick";
import type { EnterPickData } from "./enter-pick-types";

export function EnterPickForm({ data }: { data: EnterPickData }) {
  const f = useEnterPick(data);

  if (!data.members.length) {
    return (
      <Card as="section" id="enter-pick" className="p-4 space-y-2 scroll-mt-24">
        <h2 className="font-semibold">Enter a friend’s pick</h2>
        <p className="text-sm text-[var(--text-muted)]">No playing seats yet.</p>
      </Card>
    );
  }

  return (
    <Card as="section" id="enter-pick" className="p-4 space-y-3 scroll-mt-24">
      <div>
        <h2 className="font-semibold">Enter a friend’s pick</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          They called or texted. Nickname, week, unused team. Goes through
          the same import path as CSV — we do not write the database from here.
        </p>
      </div>
      {f.saved ? (
        <div className="space-y-3">
          <p className="text-sm text-field-400" role="status">
            Saved {f.saved.nickname} → {f.saved.teamAbbr} for Week{" "}
            {f.saved.weekNumber}.
          </p>
          <Button className="w-full" onClick={() => f.setSaved(null)}>
            Enter another
          </Button>
        </div>
      ) : (
        <EnterPickFields
          members={f.members}
          weeks={f.weeks}
          memberId={f.memberId}
          weekNumber={f.weekNumber}
          teamAbbr={f.teamAbbr}
          teams={f.teams}
          current={f.current}
          busy={f.busy}
          err={f.err}
          onMember={f.setMemberId}
          onWeek={f.setWeekNumber}
          onTeam={f.setTeamAbbr}
          onSubmit={(e) => void f.save(e)}
        />
      )}
    </Card>
  );
}

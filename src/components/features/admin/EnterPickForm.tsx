"use client";

import { Button, Card } from "@/components/ui";
import { EnterPickFields } from "./EnterPickFields";
import { useEnterPick } from "./use-enter-pick";
import type { EnterPickData } from "./enter-pick-types";

type Props = {
  data: EnterPickData;
  /** Friend is already chosen on this row. */
  lockMember?: boolean;
};

export function EnterPickForm({ data, lockMember = false }: Props) {
  const f = useEnterPick(data);

  if (!data.members.length) {
    return (
      <Card as="section" id="enter-pick" className="p-4 space-y-2 scroll-mt-24">
        <h2 className="font-semibold">Enter a friend’s pick</h2>
        <p className="text-sm text-[var(--text-muted)]">No playing seats yet.</p>
      </Card>
    );
  }

  const fields = (
    <EnterPickFields
      lockMember={lockMember}
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
  );
  const body = f.saved ? (
    <div className="space-y-3">
      <p className="text-sm text-field-400" role="status">
        Saved {f.saved.nickname} → {f.saved.teamAbbr} for Week {f.saved.weekNumber}.
      </p>
      <Button className="w-full" onClick={() => f.setSaved(null)}>
        {lockMember ? "Change pick" : "Enter another"}
      </Button>
    </div>
  ) : (
    fields
  );

  if (lockMember) {
    return (
      <section
        id="member-pick"
        data-testid="member-pick"
        className="rounded-md border border-stadium-border p-3 space-y-2"
      >
        <h3 className="text-sm font-semibold">Pick</h3>
        <p className="text-xs text-[var(--text-muted)]">
          Choose an open week. Saving replaces that week’s pick.
        </p>
        {body}
      </section>
    );
  }

  return (
    <Card as="section" id="enter-pick" className="p-4 space-y-3 scroll-mt-24">
      <div>
        <h2 className="font-semibold">Enter a friend’s pick</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          They called or texted. Current or past weeks only. Next week
          opens after their own game starts and they have a pick. The same
          pick is on that person’s Users row.
        </p>
      </div>
      {body}
    </Card>
  );
}

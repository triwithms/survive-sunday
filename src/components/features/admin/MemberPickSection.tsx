"use client";

import { enterPickStatusError } from "@/lib/enter-pick-status";
import { EnterPickForm } from "./EnterPickForm";
import { memberWeekPick } from "./enter-pick-options";
import type { EnterPickData } from "./enter-pick-types";
import type { RosterMember } from "./roster-types";

type Props = {
  member: RosterMember;
  data: EnterPickData;
};

function primeOpen(el: HTMLDetailsElement | null) {
  if (!el || el.dataset.primed === "1") return;
  el.open = true;
  el.dataset.primed = "1";
}

/** Pick for this person. Open when the row is open. Out has no controls. */
export function MemberPickSection({ member, data }: Props) {
  const blocked = enterPickStatusError(member.status);
  const pick = memberWeekPick(data.members, member.id, data.currentWeek);
  const summary = blocked
    ? blocked
    : pick
      ? `Week ${data.currentWeek}: ${pick}`
      : `Week ${data.currentWeek}: No pick`;
  const mine = data.members.find((row) => row.id === member.id);
  return (
    <details
      id={`member-pick-${member.id}`}
      ref={primeOpen}
      data-testid="member-pick"
      className="rounded-md border border-stadium-border p-3"
    >
      <summary className="min-h-11 cursor-pointer text-sm font-semibold">
        Pick
        <span className="mt-0.5 block text-xs font-normal text-[var(--text-muted)]">
          {summary}
        </span>
      </summary>
      {blocked || !mine ? null : (
        <div className="pt-2">
          <EnterPickForm data={{ ...data, members: [mine] }} lockMember />
        </div>
      )}
    </details>
  );
}

"use client";

import { enterPickStatusError } from "@/lib/enter-pick-status";
import { EnterPickForm } from "./EnterPickForm";
import type { EnterPickData } from "./enter-pick-types";
import type { RosterMember } from "./roster-types";

type Props = {
  member: RosterMember;
  data: EnterPickData;
};

/** Pick for this person. Open when the row is open. Out has no controls. */
export function MemberPickSection({ member, data }: Props) {
  const blocked = enterPickStatusError(member.status);
  if (blocked) {
    return (
      <section
        data-testid="member-pick"
        className="rounded-md border border-stadium-border p-3 space-y-1"
      >
        <h3 className="text-sm font-semibold">Pick</h3>
        <p className="text-sm text-[var(--text-muted)]">{blocked}</p>
      </section>
    );
  }
  const mine = data.members.find((row) => row.id === member.id);
  if (!mine) return null;
  return <EnterPickForm data={{ ...data, members: [mine] }} lockMember />;
}

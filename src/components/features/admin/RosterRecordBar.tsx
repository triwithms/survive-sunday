"use client";

import { Button } from "@/components/ui";
import { channelsOf } from "@/lib/notify-pref-columns";
import { noticeCounts } from "@/lib/notice-audience";
import { RosterRemindButton } from "./RosterRemindButton";
import type { RosterMember } from "./roster-types";

type Props = {
  member: RosterMember;
  weekPick: string | null;
  weekOpen: boolean;
};

function focusPick(id: string) {
  const el = document.getElementById(`member-pick-${id}`);
  if (el instanceof HTMLDetailsElement) el.open = true;
  el?.scrollIntoView({ block: "nearest" });
}

export function RosterRecordBar({ member, weekPick, weekOpen }: Props) {
  if (member.status === "eliminated") return null;
  const plan = noticeCounts(
    [
      {
        userId: member.userId,
        nickname: member.nickname,
        email: member.email,
        phoneE164: member.phoneE164,
        notifyPref: member.notifyPref,
        masterOn: member.notifyPrefs?.masterOn,
        channels: member.notifyPrefs ? channelsOf(member.notifyPrefs) : undefined,
      },
    ],
    "missingPickReminder"
  );
  return (
    <div
      className="sticky top-[var(--app-header-h,0px)] z-10 flex gap-2 bg-stadium-900/95 py-2 backdrop-blur"
      data-testid="roster-record-bar"
    >
      <Button
        className="min-h-11 flex-1"
        onClick={() => focusPick(member.id)}
        data-testid="roster-change-pick"
      >
        Change pick
      </Button>
      {!weekPick && weekOpen ? (
        <RosterRemindButton
          membershipId={member.id}
          nickname={member.nickname}
          plan={plan}
        />
      ) : null}
    </div>
  );
}

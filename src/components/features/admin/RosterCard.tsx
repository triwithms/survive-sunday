"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MirrorPicksForm } from "@/components/MirrorPicksForm";
import { InviteLinkCopy } from "@/components/InviteLinkCopy";
import { Button, Card } from "@/components/ui";
import { isSeatClaimed } from "@/lib/claim-seat";
import { resolvePickBackupMode } from "@/lib/pick-mirror";
import { postRosterSave } from "./post-roster-save";
import { RosterCardFields } from "./RosterCardFields";
import type { RosterMember, RosterMirrorOption } from "./roster-types";

type Props = {
  member: RosterMember;
  rosterNicknames: string[];
  mirrorOptions: RosterMirrorOption[];
  disabled: boolean;
  busy: boolean;
  onBusy: (busy: boolean) => void;
  onMsg: (msg: string) => void;
  onErr: (err: string) => void;
};

export function RosterCard({ member, rosterNicknames, mirrorOptions, disabled, busy, onBusy, onMsg, onErr }: Props) {
  const router = useRouter();
  const [nickname, setNickname] = useState(member.nickname);
  const [realName, setRealName] = useState(member.realName ?? "");
  const initialMode = resolvePickBackupMode(member.pickBackup, member.mirrorFromMembershipId);
  useEffect(() => {
    setNickname(member.nickname);
    setRealName(member.realName ?? "");
  }, [member.nickname, member.realName]);
  const dirty =
    nickname.trim() !== member.nickname || realName.trim() !== (member.realName ?? "");

  async function save() {
    onBusy(true); onMsg(""); onErr("");
    try {
      const data = await postRosterSave(member.id, nickname.trim(), realName.trim());
      if (!data.ok) { onErr(data.error); return; }
      onMsg(`Saved ${data.membership?.nickname}${data.membership?.realName ? ` (${data.membership.realName})` : ""}`);
      router.refresh();
    } catch {
      onErr("Network error — try again");
    } finally {
      onBusy(false);
    }
  }

  return (
    <Card as="li" className="p-4 space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium">
          {member.nickname}
          <span className="text-[var(--text-muted)] font-normal"> · {member.realName || "no real name"}</span>
        </p>
        <span className="text-xs text-[var(--text-muted)]">
          {member.role === "admin" ? "Commissioner" : member.status.replace("_", " ")}
        </span>
      </div>
      {member.email ? <p className="text-xs text-[var(--text-muted)] break-all">{member.email}</p> : null}
      {member.role !== "admin" ? (
        <InviteLinkCopy
          membershipId={member.id}
          nickname={member.nickname}
          claimed={isSeatClaimed(member.email)}
          rosterNicknames={rosterNicknames}
        />
      ) : null}
      <RosterCardFields
        nickname={nickname} realName={realName} disabled={disabled || busy}
        onNickname={setNickname} onRealName={setRealName}
      />
      <Button className="w-full" disabled={disabled || busy || !dirty} onClick={() => void save()}>
        {busy ? "Saving…" : "Save this person"}
      </Button>
      {member.role !== "admin" ? (
        <MirrorPicksForm
          membershipId={member.id}
          initialMode={initialMode}
          initialSourceId={member.mirrorFromMembershipId}
          options={mirrorOptions}
          saveAsAdmin
        />
      ) : null}
    </Card>
  );
}

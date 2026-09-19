"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { resolvePickBackupMode } from "@/lib/pick-mirror";
import { postRosterSave } from "./post-roster-save";
import { RosterRow } from "./RosterRow";
import { UserEditPanel } from "./UserEditPanel";
import type { RosterMember, RosterMirrorOption } from "./roster-types";

type Props = {
  member: RosterMember;
  rosterNicknames: string[];
  mirrorOptions: RosterMirrorOption[];
  open: boolean;
  onToggle: () => void;
  disabled: boolean;
  busy: boolean;
  onBusy: (busy: boolean) => void;
  onMsg: (msg: string) => void;
  onErr: (err: string) => void;
};

export function RosterCard(p: Props) {
  const { member } = p;
  const router = useRouter();
  const [nickname, setNickname] = useState(member.nickname);
  const [realName, setRealName] = useState(member.realName ?? "");
  const initialMode = resolvePickBackupMode(
    member.pickBackup,
    member.mirrorFromMembershipId
  );
  useEffect(() => {
    setNickname(member.nickname);
    setRealName(member.realName ?? "");
  }, [member.nickname, member.realName]);
  const dirty =
    nickname.trim() !== member.nickname ||
    realName.trim() !== (member.realName ?? "");
  const sourceNick = p.mirrorOptions.find(
    (o) => o.id === member.mirrorFromMembershipId
  )?.nickname;

  async function save() {
    p.onBusy(true); p.onMsg(""); p.onErr("");
    try {
      const data = await postRosterSave(member.id, nickname.trim(), realName.trim());
      if (!data.ok) { p.onErr(data.error); return; }
      p.onMsg(`Saved ${data.membership?.nickname}${data.membership?.realName ? ` (${data.membership.realName})` : ""}`);
      router.refresh();
    } catch {
      p.onErr("Network error — try again");
    } finally {
      p.onBusy(false);
    }
  }

  return (
    <RosterRow
      member={member}
      open={p.open}
      onToggle={p.onToggle}
      backupSourceNickname={sourceNick}
      rosterNicknames={p.rosterNicknames}
    >
      <UserEditPanel
        member={member}
        nickname={nickname}
        realName={realName}
        disabled={p.disabled || p.busy}
        busy={p.busy}
        dirty={dirty}
        initialMode={initialMode}
        mirrorOptions={p.mirrorOptions}
        onNickname={setNickname}
        onRealName={setRealName}
        onSave={() => void save()}
      />
    </RosterRow>
  );
}

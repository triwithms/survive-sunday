"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatPhoneDisplay } from "@/lib/phone";
import { postRosterSave } from "./post-roster-save";
import type { RosterMember } from "./roster-types";

export type RosterDraft = {
  nickname: string;
  realName: string;
  email: string;
  phone: string;
};

export function draftFromMember(member: RosterMember): RosterDraft {
  return {
    nickname: member.nickname,
    realName: member.realName ?? "",
    email: member.email ?? "",
    phone: member.phoneE164 ? formatPhoneDisplay(member.phoneE164) : "",
  };
}

export function rosterDraftDirty(draft: RosterDraft, member: RosterMember) {
  const phoneWas = member.phoneE164 ? formatPhoneDisplay(member.phoneE164) : "";
  return (
    draft.nickname.trim() !== member.nickname ||
    draft.realName.trim() !== (member.realName ?? "") ||
    draft.email.trim() !== (member.email ?? "") ||
    draft.phone.trim() !== phoneWas
  );
}

export function useRosterEdit(
  member: RosterMember,
  onBusy: (busy: boolean) => void,
  onMsg: (msg: string) => void,
  onErr: (err: string) => void
) {
  const router = useRouter();
  const [draft, setDraft] = useState(() => draftFromMember(member));
  useEffect(() => {
    setDraft(draftFromMember(member));
  }, [member]);

  function patch(next: Partial<RosterDraft>) {
    setDraft((prev) => ({ ...prev, ...next }));
  }

  async function save() {
    onBusy(true);
    onMsg("");
    onErr("");
    try {
      const data = await postRosterSave({
        membershipId: member.id,
        nickname: draft.nickname.trim(),
        realName: draft.realName.trim(),
        email: draft.email.trim(),
        phone: draft.phone.trim(),
      });
      if (!data.ok) {
        onErr(data.error);
        return;
      }
      const nick = data.membership?.nickname ?? draft.nickname;
      const real = data.membership?.realName;
      onMsg(`Saved ${nick}${real ? ` (${real})` : ""}`);
      router.refresh();
    } catch {
      onErr("Network error — try again");
    } finally {
      onBusy(false);
    }
  }

  return { draft, dirty: rosterDraftDirty(draft, member), patch, save };
}

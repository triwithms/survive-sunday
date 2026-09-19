"use client";

import { useState } from "react";
import type { PasswordKind, SetPasswordMember } from "./password-members";

export async function postTempPassword(
  membershipId: string,
  confirmNickname: string,
  password: string
) {
  const res = await fetch("/api/admin/set-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ membershipId, confirmNickname, password }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    nickname?: string;
    emailMasked?: string;
    email?: string;
  };
  if (!res.ok) {
    return { ok: false as const, error: data.error || "Could not save that password." };
  }
  return {
    ok: true as const,
    nickname: data.nickname,
    emailMasked: data.emailMasked,
    email: data.email,
  };
}

export type SavedPassword = {
  nickname: string;
  email: string;
  emailMasked: string;
  password: string;
  kind: PasswordKind;
};

export function usePasswordForm(members: SetPasswordMember[]) {
  const claimed = members.filter((m) => m.claimed);
  const unclaimed = members.filter((m) => !m.claimed);
  const [membershipId, setMembershipId] = useState(claimed[0]?.id ?? "");
  const [confirmNickname, setConfirmNickname] = useState(
    claimed[0]?.nickname ?? ""
  );
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [kind, setKind] = useState<PasswordKind>("temporary");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState<SavedPassword | null>(null);
  const selected = members.find((m) => m.id === membershipId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setSaved(null);
    if (!selected?.claimed) {
      setErr(
        selected
          ? `${selected.nickname} has not Joined yet. Send them their personal Join link instead of a password.`
          : "Pick someone who has already Joined."
      );
      return;
    }
    if (password !== confirm) {
      setErr("Those passwords don’t match.");
      return;
    }
    setBusy(true);
    const data = await postTempPassword(selected.id, confirmNickname.trim(), password);
    setBusy(false);
    if (!data.ok) {
      setErr(data.error);
      return;
    }
    setSaved({
      nickname: data.nickname || selected.nickname,
      email: data.email || selected.email || "",
      emailMasked: data.emailMasked || selected.emailMasked || "",
      password,
      kind,
    });
    setConfirmNickname("");
  }

  return {
    claimed, unclaimed, membershipId, setMembershipId, confirmNickname,
    setConfirmNickname, password, setPassword, confirm, setConfirm, kind,
    setKind, busy, setBusy, err, setErr, saved, setSaved, selected, submit,
  };
}

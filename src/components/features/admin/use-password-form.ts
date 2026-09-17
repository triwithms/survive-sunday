"use client";

import { useState } from "react";
import type { SetPasswordMember } from "./password-members";

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
  };
  if (!res.ok) return { ok: false as const, error: data.error || "Could not save that password." };
  return {
    ok: true as const,
    nickname: data.nickname,
    emailMasked: data.emailMasked,
  };
}

export function usePasswordForm(members: SetPasswordMember[]) {
  const claimed = members.filter((m) => m.claimed);
  const unclaimed = members.filter((m) => !m.claimed);
  const [membershipId, setMembershipId] = useState(claimed[0]?.id ?? "");
  const [confirmNickname, setConfirmNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState<{
    nickname: string;
    emailMasked: string;
    password: string;
  } | null>(null);
  return {
    claimed, unclaimed, membershipId, setMembershipId, confirmNickname,
    setConfirmNickname, password, setPassword, confirm, setConfirm, busy,
    setBusy, err, setErr, saved, setSaved,
    selected: members.find((m) => m.id === membershipId),
  };
}

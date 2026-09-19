"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { suggestTempPassword } from "./password-members";
import { EMPTY_ADD_USER, type AddUserDraft, type AddUserSaved } from "./add-user-types";

export function useAddUser() {
  const router = useRouter();
  const [draft, setDraft] = useState<AddUserDraft>(EMPTY_ADD_USER);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState<AddUserSaved | null>(null);

  function patch(next: Partial<AddUserDraft>) {
    setDraft((prev) => ({ ...prev, ...next }));
  }

  function reset() {
    setDraft(EMPTY_ADD_USER);
    setSaved(null);
    setErr("");
  }

  function suggest() {
    const next = suggestTempPassword();
    patch({ password: next, confirm: next });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (draft.password && draft.password !== draft.confirm) {
      setErr("Passwords don’t match.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/add-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: draft.nickname,
          realName: draft.realName,
          email: draft.email,
          phone: draft.phone,
          password: draft.password,
          invite: draft.invite,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || "Could not add that person.");
        return;
      }
      setSaved(data.membership as AddUserSaved);
      router.refresh();
    } catch {
      setErr("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  return { draft, patch, busy, err, saved, submit, reset, suggest };
}

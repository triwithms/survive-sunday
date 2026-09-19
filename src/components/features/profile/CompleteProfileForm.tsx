"use client";

import { useState } from "react";
import type { ProfileField as Missing } from "@/lib/profile-complete";
import { ProfileField } from "./ProfileField";
import { saveNicknameAndName, savePhone } from "./save-profile";

type Props = { missing: Missing[]; nickname: string; fullName: string };

export function CompleteProfileForm({ missing, nickname, fullName }: Props) {
  const needNick = missing.includes("nickname");
  const needName = missing.includes("fullName");
  const needPhone = missing.includes("phone");
  const [nick, setNick] = useState(nickname);
  const [name, setName] = useState(fullName);
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      if (needNick || needName) {
        const msg = await saveNicknameAndName({
          nickname: needNick ? nick.trim() : nickname,
          ...(needName ? { realName: name.trim() } : {}),
        });
        if (msg) {
          setErr(msg);
          return;
        }
      }
      if (needPhone) {
        const msg = await savePhone(phone.trim());
        if (msg) {
          setErr(msg);
          return;
        }
      }
      window.location.assign("/pick");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 card-glass p-5">
      {needNick && (
        <ProfileField
          label="Nickname"
          value={nick}
          onChange={setNick}
          autoComplete="nickname"
          maxLength={24}
        />
      )}
      {needName && (
        <ProfileField
          label="Full name"
          value={name}
          onChange={setName}
          autoComplete="name"
          maxLength={80}
        />
      )}
      {needPhone && (
        <ProfileField
          label="Cell phone"
          value={phone}
          onChange={setPhone}
          autoComplete="tel"
          inputMode="tel"
          placeholder="(416) 951-4262"
        />
      )}
      {err && (
        <p className="text-crimson-400 text-sm" role="alert">
          {err}
        </p>
      )}
      <button type="submit" className="btn-primary w-full" disabled={busy}>
        {busy ? "Saving…" : "Continue"}
      </button>
    </form>
  );
}

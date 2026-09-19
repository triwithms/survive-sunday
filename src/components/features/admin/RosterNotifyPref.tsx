"use client";

import { useState } from "react";
import { parseNotifyPref, type NotifyPref } from "@/lib/notify-pref";
import { NotifyPrefSelect } from "@/components/NotifyPrefSelect";

export function RosterNotifyPref({
  userId,
  initial,
}: {
  userId: string;
  initial: string | null;
}) {
  const [pref, setPref] = useState<NotifyPref>(parseNotifyPref(initial) ?? "email");
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  async function onChange(next: NotifyPref) {
    setPref(next);
    setErr("");
    setSaved(false);
    const res = await fetch("/api/admin/notify-pref", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, pref: next }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(typeof data.error === "string" ? data.error : "Could not save");
      return;
    }
    setSaved(true);
  }

  return (
    <fieldset
      className="space-y-1 rounded-lg border border-stadium-border p-3"
      data-testid="roster-notify-pref"
    >
      <legend className="px-1 text-sm font-medium">Notifications</legend>
      <NotifyPrefSelect
        value={pref}
        onChange={onChange}
        testId="roster-notify-pref-select"
      />
      {saved ? <p className="text-xs text-gold-400">Saved</p> : null}
      {err ? <p className="text-xs text-crimson-400">{err}</p> : null}
    </fieldset>
  );
}

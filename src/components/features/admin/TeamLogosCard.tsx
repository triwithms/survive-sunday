"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card } from "@/components/ui";

export function TeamLogosCard(props: { showTeamLogos: boolean; forcedOff: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(props.showTeamLogos);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function save(next: boolean) {
    const prev = on;
    setOn(next);
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/admin/team-logos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ showTeamLogos: next }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    setBusy(false);
    if (!res?.ok) {
      setOn(prev);
      setMsg(data.error || "Could not save team logos.");
      return;
    }
    setMsg(data.summary || "Saved.");
    router.refresh();
  }

  return (
    <Card as="section" className="space-y-2 p-4" data-testid="team-logos-setting">
      <label className="flex min-h-11 items-start gap-3 text-sm">
        <input
          type="checkbox"
          className="mt-1 h-5 w-5 shrink-0 accent-[var(--gold-400,#d4a017)]"
          checked={on}
          disabled={busy}
          onChange={(e) => void save(e.target.checked)}
          data-testid="team-logos-toggle"
        />
        <span className="space-y-1">
          <span className="block font-semibold">Team logos</span>
          <span className="block text-[var(--text-muted)]">
            Off shows team abbreviations instead of logos.
          </span>
        </span>
      </label>
      {props.forcedOff ? (
        <p className="text-sm text-[var(--text-muted)]" data-testid="team-logos-forced">
          A site setting shows abbreviations for every pool right now. This
          switch applies again once that setting is removed.
        </p>
      ) : null}
      {msg ? (
        <p className="text-sm text-field-400" role="status">
          {msg}
        </p>
      ) : null}
    </Card>
  );
}

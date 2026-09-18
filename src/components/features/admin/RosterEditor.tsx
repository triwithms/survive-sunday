"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import { RosterCard } from "./RosterCard";
import type { RosterMember, RosterMirrorOption } from "./roster-types";

export type { RosterMember, RosterMirrorOption } from "./roster-types";

export function RosterEditor({
  members,
  mirrorOptions,
}: {
  members: RosterMember[];
  mirrorOptions: RosterMirrorOption[];
}) {
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const nicknames = members.map((row) => row.nickname);
  return (
    <Card as="section" className="p-4 space-y-3 min-w-0">
      <div>
        <h2 className="font-semibold">Roster</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Tap a person to edit name and pick backup. Only one is open at a time.
        </p>
      </div>
      {msg ? <p className="text-sm text-field-400" role="status">{msg}</p> : null}
      {err ? <p className="text-sm text-crimson-400" role="alert">{err}</p> : null}
      <ul className="divide-y divide-stadium-border min-w-0">
        {members.map((m) => (
          <RosterCard
            key={m.id}
            member={m}
            rosterNicknames={nicknames}
            mirrorOptions={mirrorOptions.filter((o) => o.id !== m.id)}
            open={openId === m.id}
            onToggle={() => setOpenId((id) => (id === m.id ? null : m.id))}
            disabled={busyId !== null && busyId !== m.id}
            busy={busyId === m.id}
            onBusy={(busy) => setBusyId(busy ? m.id : null)}
            onMsg={setMsg}
            onErr={setErr}
          />
        ))}
      </ul>
    </Card>
  );
}

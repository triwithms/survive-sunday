"use client";

import { useState } from "react";
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
  return (
    <div className="space-y-3">
      {msg ? <p className="text-sm text-field-400" role="status">{msg}</p> : null}
      {err ? <p className="text-sm text-crimson-400" role="alert">{err}</p> : null}
      <ul className="space-y-3">
        {members.map((m) => (
          <RosterCard
            key={m.id}
            member={m}
            rosterNicknames={members.map((row) => row.nickname)}
            mirrorOptions={mirrorOptions.filter((o) => o.id !== m.id)}
            disabled={busyId !== null && busyId !== m.id}
            busy={busyId === m.id}
            onBusy={(busy) => setBusyId(busy ? m.id : null)}
            onMsg={setMsg}
            onErr={setErr}
          />
        ))}
      </ul>
    </div>
  );
}

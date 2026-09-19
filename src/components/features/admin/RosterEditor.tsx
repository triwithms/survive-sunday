"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import { rosterMatches } from "./roster-row-meta";
import { RosterCard } from "./RosterCard";
import type { RosterMember, RosterMirrorOption } from "./roster-types";

export type { RosterMember, RosterMirrorOption } from "./roster-types";

export function RosterEditor({
  members,
}: {
  members: RosterMember[];
}) {
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const visible = members.filter((m) => rosterMatches(m, query));
  return (
    <Card as="section" className="p-4 space-y-3 min-w-0">
      <div>
        <h2 className="font-semibold">Roster</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Tap a person to edit their profile or set a password. The invite
          icon shares a Sign in link. One open at a time.
        </p>
      </div>
      <label className="block text-sm space-y-1">
        <span className="sr-only">Find a friend</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find a friend"
          autoComplete="off"
          data-testid="roster-search"
          className="w-full min-h-11"
        />
      </label>
      {msg ? <p className="text-sm text-field-400" role="status">{msg}</p> : null}
      {err ? <p className="text-sm text-crimson-400" role="alert">{err}</p> : null}
      {visible.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No one matches that.</p>
      ) : (
        <ul className="divide-y divide-stadium-border min-w-0">
          {visible.map((m) => (
            <RosterCard
              key={m.id}
              member={m}
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
      )}
    </Card>
  );
}

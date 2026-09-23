"use client";

import { useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui";
import type { EnterPickData } from "./enter-pick-types";
import { rosterEmptyCopy, rosterFilterCounts, type RosterFilterId } from "./roster-needs-you";
import { readRosterScroll, writeRosterScroll } from "./roster-scroll";
import { buildRosterRows, visibleRosterRows } from "./roster-rows";
import { RosterCard } from "./RosterCard";
import { RosterFilters } from "./RosterFilters";
import { RosterOpenScroll } from "./RosterOpenScroll";
import type { RosterMember } from "./roster-types";

export type { RosterMember, RosterMirrorOption } from "./roster-types";

export function RosterEditor({
  members,
  enterPick,
  openMemberId = null,
}: {
  members: RosterMember[];
  enterPick: EnterPickData;
  openMemberId?: string | null;
}) {
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(openMemberId);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<RosterFilterId>("all");
  const rootRef = useRef<HTMLDivElement>(null);
  const savedScroll = useRef(0);
  const weekOpen = enterPick.currentWeekOpen === true;
  const rows = useMemo(() => buildRosterRows(members, enterPick), [members, enterPick]);
  const counts = useMemo(() => rosterFilterCounts(rows), [rows]);
  const visible = visibleRosterRows(rows, query, filter, weekOpen);

  function onToggle(id: string) {
    setOpenId((cur) => {
      if (cur === id) {
        const y = savedScroll.current;
        requestAnimationFrame(() => writeRosterScroll(rootRef.current, y));
        return null;
      }
      savedScroll.current = readRosterScroll(rootRef.current);
      return id;
    });
  }

  return (
    <Card as="section" className="p-4 space-y-3 min-w-0">
      <div ref={rootRef}>
        <h2 className="font-semibold">Roster</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Tap a person to edit their profile or set a password. Copy join link
          shares a Sign in link. One open at a time.
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
      <RosterFilters value={filter} counts={counts} onChange={setFilter} />
      <RosterOpenScroll memberId={openMemberId} />
      {msg ? <p className="text-sm text-field-400" role="status">{msg}</p> : null}
      {err ? <p className="text-sm text-crimson-400" role="alert">{err}</p> : null}
      {visible.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">
          {rosterEmptyCopy(filter, enterPick.currentWeek, query.trim().length > 0)}
        </p>
      ) : (
        <ul className="divide-y divide-stadium-border min-w-0" data-testid="roster-list">
          {visible.map((row) => (
            <RosterCard
              key={row.member.id}
              member={row.member}
              enterPick={enterPick}
              open={openId === row.member.id}
              onToggle={() => onToggle(row.member.id)}
              disabled={busyId !== null && busyId !== row.member.id}
              busy={busyId === row.member.id}
              onBusy={(busy) => setBusyId(busy ? row.member.id : null)}
              onMsg={setMsg}
              onErr={setErr}
            />
          ))}
        </ul>
      )}
    </Card>
  );
}

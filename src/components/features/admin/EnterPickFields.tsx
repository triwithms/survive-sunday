"use client";

import { Button } from "@/components/ui";
import { enterPickLabel } from "./enter-pick-options";
import type { EnterPickMember, EnterPickTeam, EnterPickWeek } from "./enter-pick-types";

type Props = {
  members: EnterPickMember[];
  weeks: EnterPickWeek[];
  memberId: string;
  weekNumber: number;
  teamAbbr: string;
  teams: EnterPickTeam[];
  current: string | null;
  busy: boolean;
  err: string;
  onMember: (id: string) => void;
  onWeek: (week: number) => void;
  onTeam: (abbr: string) => void;
  onSubmit: (e: React.FormEvent) => void;
};

export function EnterPickFields(p: Props) {
  return (
    <form onSubmit={p.onSubmit} className="space-y-3">
      <label className="block text-sm space-y-1">
        <span className="text-[var(--text-muted)]">Friend</span>
        <select
          className="w-full min-h-11 rounded-md bg-stadium-800 border border-stadium-border px-3"
          value={p.memberId}
          onChange={(e) => p.onMember(e.target.value)}
        >
          {p.members.map((m) => (
            <option key={m.id} value={m.id}>{enterPickLabel(m)}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm space-y-1">
        <span className="text-[var(--text-muted)]">Week</span>
        <select
          className="w-full min-h-11 rounded-md bg-stadium-800 border border-stadium-border px-3"
          value={p.weekNumber}
          onChange={(e) => p.onWeek(Number(e.target.value))}
        >
          {p.weeks.map((w) => (
            <option key={w.number} value={w.number}>Week {w.number}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm space-y-1">
        <span className="text-[var(--text-muted)]">Team (unused this week)</span>
        <select
          required
          className="w-full min-h-11 rounded-md bg-stadium-800 border border-stadium-border px-3"
          value={p.teamAbbr}
          onChange={(e) => p.onTeam(e.target.value)}
        >
          <option value="">Pick a team</option>
          {p.teams.map((t) => (
            <option key={t.abbr} value={t.abbr}>{t.name}</option>
          ))}
        </select>
      </label>
      {p.current ? (
        <p className="text-xs text-[var(--text-muted)]">
          Saved pick this week: {p.current}. Saving replaces it.
        </p>
      ) : null}
      {p.teams.length === 0 ? (
        <p className="text-sm text-crimson-400">No unused teams left this week.</p>
      ) : null}
      {p.err ? <p className="text-sm text-crimson-400" role="alert">{p.err}</p> : null}
      <Button type="submit" className="w-full" disabled={p.busy || !p.teamAbbr}>
        {p.busy ? "Saving…" : "Save pick"}
      </Button>
    </form>
  );
}

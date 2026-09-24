import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { InjuryStatusChip } from "@/components/InjuryStatusChip";
import { roleLabel } from "@/lib/nfl-player";
import type { NflPlayerView } from "@/lib/team-research";

export function playerHref(teamAbbr: string, slug: string): string {
  return `/team/${teamAbbr}/player/${encodeURIComponent(slug)}`;
}

export function NflPlayerRows({
  teamAbbr,
  players,
}: {
  teamAbbr: string;
  players: NflPlayerView[];
}) {
  return (
    <ul className="divide-y divide-stadium-border">
      {players.map((p) => (
        <li key={p.slug}>
          <Link
            href={playerHref(teamAbbr, p.slug)}
            prefetch={false}
            className="flex items-center gap-2 min-h-11 min-h-[44px] py-2.5 min-w-0 rounded-md px-0.5 hover:bg-gold-400/5 active:bg-gold-400/10"
            aria-label={`${p.name}, ${p.position}${p.number != null ? ` #${p.number}` : ""}`}
          >
            <span className="font-mono text-[var(--text-muted)] w-8 shrink-0 text-xs">
              {p.number != null ? `#${p.number}` : "—"}
            </span>
            <span className="font-mono text-xs text-gold-400 w-8 shrink-0">
              {p.position}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium break-words leading-snug">
                {p.name}
              </span>
              <span className="block text-xs text-[var(--text-muted)] break-words">
                {p.college || "—"}
                {p.keyPlayer ? " · Key" : ""}
              </span>
            </span>
            <span className="shrink-0 flex flex-col items-end gap-1">
              {p.injury ? (
                <InjuryStatusChip status={p.injury.status} compact />
              ) : (
                <span className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                  {roleLabel(p.role)}
                </span>
              )}
            </span>
            <ChevronRight
              className="h-6 w-6 shrink-0 text-[var(--text-muted)]"
              aria-hidden
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function KeyPlayerCards({
  teamAbbr,
  players,
}: {
  teamAbbr: string;
  players: NflPlayerView[];
}) {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {players.map((p) => (
        <li key={p.slug}>
          <Link
            href={playerHref(teamAbbr, p.slug)}
            prefetch={false}
            className="card-glass block p-3 min-h-11 hover:border-gold-400/50 active:bg-gold-400/5"
            aria-label={`Player details for ${p.name}`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-mono text-xs text-gold-400">
                {p.number != null ? `#${p.number}` : "—"} · {p.position}
              </p>
              {p.injury ? (
                <InjuryStatusChip status={p.injury.status} compact />
              ) : (
                <span className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                  {roleLabel(p.role)}
                </span>
              )}
            </div>
            <p className="mt-1 font-medium leading-snug break-words">{p.name}</p>
            <p className="mt-0.5 text-xs text-[var(--text-muted)] truncate">
              {p.college || "College unknown"}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

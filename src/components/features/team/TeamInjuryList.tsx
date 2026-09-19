import Link from "next/link";
import { playerHref } from "@/components/NflPlayerRows";
import { namesMatch } from "@/lib/nfl-player";
import type { LiveInjury } from "@/lib/live-injuries";
import type { NflPlayerView } from "@/lib/team-research";
import { formatInjuryWhen, injuryChipClass } from "./team-format";

export function TeamInjuryList({
  rows,
  teamAbbr,
  players,
}: {
  rows: LiveInjury[];
  teamAbbr: string;
  players: NflPlayerView[];
}) {
  return (
    <ul className="divide-y divide-stadium-border text-sm">
      {rows.map((row) => {
        const when = formatInjuryWhen(row.updated);
        const match = players.find((p) => namesMatch(p.name, row.player));
        const linkClass =
          "font-medium underline decoration-gold-400/40 underline-offset-2 hover:decoration-gold-400";
        const name = match ? (
          <Link href={playerHref(teamAbbr, match.slug)} prefetch={false} className={linkClass}>
            {row.player}
          </Link>
        ) : row.playerUrl ? (
          <a href={row.playerUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
            {row.player}
          </a>
        ) : (
          <span className="font-medium">{row.player}</span>
        );
        return (
          <li key={`${row.player}-${row.status}-${row.injury}`} className="py-2.5 space-y-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="font-mono text-xs text-gold-400 w-8 shrink-0">
                {row.position}
              </span>
              <span className="min-w-0 flex-1 break-words">{name}</span>
              <span className={`chip text-xs shrink-0 ${injuryChipClass(row.status)}`}>
                {row.status}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] pl-10">
              {row.injury}
              {when ? ` · ${when}` : ""}
            </p>
            {row.comment && (
              <p className="text-xs text-[var(--text-muted)] pl-10 leading-relaxed">
                {row.comment}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

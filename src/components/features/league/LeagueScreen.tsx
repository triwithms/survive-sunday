import Link from "next/link";
import { NflStandingsClient } from "@/components/NflStandingsClient";
import type { LeaguePageData } from "./load-league";

export function LeagueScreen({ asOf, note, teams }: LeaguePageData) {
  return (
    <div className="space-y-5 min-w-0">
      <div>
        <h1 className="font-display text-2xl text-gold-400 tracking-wide">
          NFL standings
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Live league table · tap a team for research ·{" "}
          <Link
            href="/standings"
            prefetch={false}
            className="text-gold-400 underline underline-offset-2"
          >
            pool survival board
          </Link>
        </p>
      </div>
      <NflStandingsClient
        asOf={asOf}
        note={note}
        teams={teams}
      />
    </div>
  );
}

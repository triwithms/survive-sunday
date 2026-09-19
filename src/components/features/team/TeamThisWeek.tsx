import Link from "next/link";
import { teamHref } from "./team-paths";
import type { TeamThisWeekView } from "./types";

export function TeamThisWeek({ week }: { week: TeamThisWeekView }) {
  return (
    <section className="card-glass p-4 space-y-1">
      <h2 className="text-xl font-semibold text-gold-400">This week</h2>
      <p className="text-base">
        {week.atHome ? "Home" : "Away"} vs{" "}
        <Link
          href={teamHref(week.opponentAbbr)}
          prefetch={false}
          className="font-mono text-gold-400 underline underline-offset-2"
        >
          {week.opponentAbbr}
        </Link>
      </p>
      <p className="text-sm text-[var(--text-muted)]">{week.kickoffLabel}</p>
      {week.scoreLine && (
        <p className="text-sm text-[var(--text-muted)]">{week.scoreLine}</p>
      )}
      {week.favouriteLabel && (
        <p className="text-sm text-[var(--text-primary)]">
          {week.favouriteLabel}
        </p>
      )}
    </section>
  );
}

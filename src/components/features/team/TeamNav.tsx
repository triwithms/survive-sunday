import Link from "next/link";
import { teamHref } from "./team-paths";

export function TeamNav({ abbr }: { abbr: string }) {
  return (
    <div className="flex flex-wrap gap-3 text-base">
      <Link
        href="/nfl"
        prefetch={false}
        className="text-gold-400 underline underline-offset-2"
      >
        ← NFL standings
      </Link>
      <Link
        href="/pick"
        prefetch={false}
        className="text-[var(--text-muted)] underline underline-offset-2 hover:text-gold-400"
      >
        This week&apos;s games
      </Link>
      <Link
        href={teamHref(abbr, "schedule")}
        prefetch={false}
        className="text-[var(--text-muted)] underline underline-offset-2 hover:text-gold-400"
      >
        Schedule
      </Link>
    </div>
  );
}

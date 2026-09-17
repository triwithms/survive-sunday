import Link from "next/link";
import type { HomeEmptyPickProps } from "./types";

export function HomeEmptyPick({
  eliminated,
  spectator,
  locked,
  isCurrentWeek,
  emptyPick,
}: HomeEmptyPickProps) {
  return (
    <section className="card-glass p-4">
      <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-2">
        Your pick
      </p>
      {eliminated ? (
        <p className="text-[var(--text-muted)]">
          You&apos;re eliminated — still welcome to hang out.
        </p>
      ) : spectator ? (
        <div className="space-y-2">
          <p className="text-[var(--text-muted)]">
            Commissioner view — you&apos;re not required to pick.
          </p>
          <p className="text-sm text-[var(--text-muted)]">
            Also a player?{" "}
            <Link
              href="/join"
              className="text-gold-400 underline-offset-2 hover:underline"
            >
              Claim your name on Join
            </Link>{" "}
            with this same email so your picks stay with that seat.
          </p>
        </div>
      ) : locked || !isCurrentWeek ? (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p
            className={
              emptyPick.missed ? "text-crimson-400" : "text-[var(--text-muted)]"
            }
          >
            {emptyPick.message}
          </p>
          {emptyPick.href && emptyPick.ctaLabel ? (
            <Link
              href={emptyPick.href}
              prefetch={false}
              className="btn-primary text-sm shrink-0"
            >
              {emptyPick.ctaLabel}
            </Link>
          ) : null}
        </div>
      ) : isCurrentWeek ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-[var(--text-muted)]">
            Make your pick before kickoff—don&apos;t leave your mates hanging.
          </p>
          <Link href="/pick" prefetch={false} className="btn-primary text-sm shrink-0">
            Pick now
          </Link>
        </div>
      ) : (
        <p className="text-[var(--text-muted)]">No pick recorded for this week.</p>
      )}
    </section>
  );
}

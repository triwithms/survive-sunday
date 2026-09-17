import Link from "next/link";
import { Card } from "@/components/ui";
import { NextWeekOpenTip } from "@/components/NextWeekOpenTip";
import type { PickScreenBanner } from "@/lib/next-week-picks";

export function PickNotices({
  spectator,
  eliminated,
  week1Change,
  tipWeek,
  banner,
  msg,
  redirectIn,
}: {
  spectator: boolean;
  eliminated: boolean;
  week1Change: boolean;
  tipWeek: number | null;
  banner: PickScreenBanner | null;
  msg: string;
  redirectIn: number | null;
}) {
  const ok = /heading|updated|Locked/.test(msg);
  return (
    <>
      {spectator && (
        <Card role="status" className="border border-gold-400/40 p-3 text-sm space-y-1">
          <p className="font-semibold text-gold-400">Commissioner view</p>
          <p className="text-[var(--text-muted)]">
            You&apos;re not a player in this pool, so you don&apos;t need to
            pick. Use Admin to change rules or hand the pool to someone else.
          </p>
        </Card>
      )}
      {eliminated && (
        <Card role="status" className="border border-crimson-400/40 p-3 text-sm space-y-1">
          <p className="font-semibold text-crimson-400">Eliminated this season</p>
          <p className="text-[var(--text-muted)]">
            No more picks — you can still browse this week&apos;s games below.
          </p>
        </Card>
      )}
      {week1Change && (
        <Card role="status" className="border border-gold-400/40 p-3 text-sm space-y-1">
          <p className="font-semibold text-gold-400">Week 1 pick changes</p>
          <p className="text-[var(--text-muted)]">
            You can switch to any other team whose game has not started yet.
            Once your pick’s kickoff starts, that pick locks and next week
            opens for you.
          </p>
        </Card>
      )}
      {tipWeek != null && <NextWeekOpenTip weekNumber={tipWeek} />}
      {banner && (
        <Card role="status" className="border border-gold-400/40 p-3 text-sm space-y-1">
          <p className="font-semibold text-gold-400">{banner.title}</p>
          <p className="text-[var(--text-muted)]">{banner.body}</p>
          {banner.href && banner.hrefLabel && (
            <p>
              <Link
                href={banner.href}
                prefetch={false}
                className="btn-primary inline-flex text-sm mt-1"
              >
                {banner.hrefLabel}
              </Link>
            </p>
          )}
        </Card>
      )}
      {msg ? (
        <div
          className={`rounded-lg border p-3 text-sm space-y-2 ${
            ok
              ? "border-field-400/40 text-field-400"
              : "border-crimson-400/40 text-crimson-400"
          }`}
        >
          <p>{msg}</p>
          {redirectIn != null && (
            <Link href="/pool" prefetch={false} className="btn-primary inline-flex text-sm">
              Back to pool{redirectIn > 0 ? ` (${redirectIn})` : ""}
            </Link>
          )}
        </div>
      ) : null}
    </>
  );
}

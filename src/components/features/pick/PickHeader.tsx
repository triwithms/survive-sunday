import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function PickHeader({
  weekNumber,
  kicker,
}: {
  weekNumber: number;
  kicker: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <Link
          href="/pool"
          prefetch={false}
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-gold-400 active:scale-95 active:text-gold-400 touch-manipulation transition-transform duration-75"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          See selections
        </Link>
        <h1 className="font-display text-2xl text-gold-400 tracking-wide">
          Week {weekNumber} pick
        </h1>
        <p className="text-sm text-[var(--text-muted)]">{kicker}</p>
      </div>
    </div>
  );
}

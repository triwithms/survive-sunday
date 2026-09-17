import Link from "next/link";
import { InjuryChip } from "@/components/InjuryChip";
import { Chip } from "@/components/ui";
import { formatInjuryChip, type InjuryCountBits } from "@/lib/game-display";

export function HomePickHeroFacts({
  teamAbbr,
  priorStanding,
  gameLine,
  injuryCounts,
  favouriteLabel,
  imported,
}: {
  teamAbbr: string;
  priorStanding?: string | null;
  gameLine?: string | null;
  injuryCounts?: InjuryCountBits | null;
  favouriteLabel?: string | null;
  imported?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xl font-semibold text-gold-400">{teamAbbr}</p>
      {priorStanding ? (
        <p className="text-xs text-[var(--text-muted)] mt-0.5">{priorStanding}</p>
      ) : null}
      {gameLine ? (
        <p className="text-sm text-[var(--text-muted)]">{gameLine}</p>
      ) : null}
      {injuryCounts ? (
        <p className="mt-1">
          <Link
            href={`/team/${teamAbbr}`}
            prefetch={false}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] underline underline-offset-2 decoration-gold-400/30 hover:text-gold-400"
          >
            {formatInjuryChip(injuryCounts) ? (
              <InjuryChip counts={injuryCounts} />
            ) : (
              "Injury report"
            )}
          </Link>
        </p>
      ) : null}
      {favouriteLabel ? (
        <p className="text-xs text-[var(--text-muted)] mt-0.5">{favouriteLabel}</p>
      ) : null}
      {imported ? (
        <Chip tone="live" className="mt-1">
          Imported
        </Chip>
      ) : null}
    </div>
  );
}

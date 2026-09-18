import { Chip } from "@/components/ui";

export function HomePickHeroFacts({
  teamAbbr,
  priorStanding,
  gameLine,
  favouriteLabel,
  imported,
}: {
  teamAbbr: string;
  priorStanding?: string | null;
  gameLine?: string | null;
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

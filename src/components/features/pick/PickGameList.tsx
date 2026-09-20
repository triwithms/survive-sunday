import { Card } from "@/components/ui";
import { isGameStarted } from "@/lib/pick-change";
import { PickMatchupCard } from "./PickMatchupCard";
import type { PickMatchup, PickSide } from "./types";

export function PickGameList({
  weekNumber,
  games,
  selectedAbbr,
  readOnly,
  lockStarted,
  onPick,
}: {
  weekNumber: number;
  games: PickMatchup[];
  selectedAbbr: string | null;
  readOnly: boolean;
  lockStarted: boolean;
  onPick: (side: PickSide, matchup: PickMatchup) => void;
}) {
  return (
    <section aria-label="This week's games" className="space-y-3">
      <h2 className="text-sm font-semibold text-gold-400 tracking-wide">
        This week&apos;s games
      </h2>
      {games.length === 0 ? (
        <Card className="p-4 text-sm text-[var(--text-muted)]">
          Games for Week {weekNumber} have not been added yet.
        </Card>
      ) : (
        <ul className="space-y-3">
          {games.map((m) => (
            <PickMatchupCard
              key={m.id}
              matchup={m}
              weekNumber={weekNumber}
              selectedAbbr={selectedAbbr}
              readOnly={readOnly}
              gameClosed={lockStarted && isGameStarted(m)}
              onPick={(side) => onPick(side, m)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

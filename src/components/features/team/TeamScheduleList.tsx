import { TeamScheduleRow } from "./TeamScheduleRow";
import type { TeamScheduleItem } from "./team-schedule";

export function TeamScheduleList({ games }: { games: TeamScheduleItem[] }) {
  if (games.length === 0) {
    return (
      <p className="text-base text-[var(--text-muted)]">
        No games on file for this team yet.
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {games.map((game) => (
        <TeamScheduleRow key={game.id} game={game} />
      ))}
    </ul>
  );
}

import { HomeGameCluster, HomeMissedList } from "./HomeGameCluster";
import type { HomeGame, HomeRow } from "./types";

export function HomePicksByGame({
  games,
  rows,
  selfId,
}: {
  games: HomeGame[];
  rows: HomeRow[];
  selfId: string;
}) {
  const missed = rows.filter((row) => !row.pick);
  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">Picks by game</h2>
      <div className="space-y-5">
        {games.map((game) => (
          <HomeGameCluster
            key={game.id}
            game={game}
            awayRows={rows.filter((row) => row.pick?.teamAbbr === game.awayAbbr)}
            homeRows={rows.filter((row) => row.pick?.teamAbbr === game.homeAbbr)}
            selfId={selfId}
          />
        ))}
        {missed.length > 0 ? (
          <HomeMissedList rows={missed} selfId={selfId} />
        ) : null}
      </div>
    </section>
  );
}

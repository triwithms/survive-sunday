import Link from "next/link";
import { formatKickoff } from "@/lib/utils";
import { formatScoreLine } from "@/lib/game-display";
import {
  HomeMissedExtra,
  HomeParticipantItem,
  HomeRevealedExtra,
} from "./HomeParticipantItem";
import type { HomeGame, HomeRow } from "./types";

export function HomeGameCluster({
  game,
  awayRows,
  homeRows,
  selfId,
}: {
  game: HomeGame;
  awayRows: HomeRow[];
  homeRows: HomeRow[];
  selfId: string;
}) {
  const isLive = game.status === "live";
  const isFinal = game.status === "final";
  const clusters = [
    { abbr: game.awayAbbr, rows: awayRows },
    { abbr: game.homeAbbr, rows: homeRows },
  ] as const;
  return (
    <div className="card-glass p-4 space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="font-mono font-semibold text-gold-400">
            {game.awayAbbr} @ {game.homeAbbr}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {isLive || isFinal
              ? formatScoreLine(game) || formatKickoff(game.kickoff)
              : formatKickoff(game.kickoff)}
          </p>
        </div>
        {isLive ? <span className="chip chip-live shrink-0">LIVE</span> : null}
        {isFinal ? <span className="chip chip-gold shrink-0">final</span> : null}
      </div>
      {clusters.map((cluster) =>
        cluster.rows.length ? (
          <div key={cluster.abbr}>
            <h3 className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2">
              <Link
                href={`/team/${cluster.abbr}`}
                prefetch={false}
                className="font-mono text-gold-400 underline underline-offset-2 decoration-gold-400/40 hover:decoration-gold-400"
              >
                {cluster.abbr}
              </Link>
            </h3>
            <ul className="space-y-2">
              {cluster.rows.map((row) => (
                <HomeParticipantItem
                  key={row.id}
                  row={row}
                  isSelf={row.id === selfId}
                  extra={<HomeRevealedExtra row={row} />}
                />
              ))}
            </ul>
          </div>
        ) : null
      )}
    </div>
  );
}

export function HomeMissedList({
  rows,
  selfId,
}: {
  rows: HomeRow[];
  selfId: string;
}) {
  return (
    <div>
      <h3 className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2">
        Missed / no pick
      </h3>
      <ul className="space-y-2">
        {rows.map((row) => (
          <HomeParticipantItem
            key={row.id}
            row={row}
            isSelf={row.id === selfId}
            extra={<HomeMissedExtra row={row} />}
          />
        ))}
      </ul>
    </div>
  );
}

import { NflPlayerRows } from "@/components/NflPlayerRows";
import type { NflPlayerView } from "@/lib/team-research";

function Block({
  heading,
  teamAbbr,
  players,
}: {
  heading?: string;
  teamAbbr: string;
  players: NflPlayerView[];
}) {
  if (players.length === 0) return null;
  return (
    <div className="space-y-2">
      {heading ? (
        <h2 className="text-base font-semibold text-gold-400 pt-1">{heading}</h2>
      ) : null}
      <NflPlayerRows teamAbbr={teamAbbr} players={players} />
    </div>
  );
}

export function TeamUnitBlocks({
  teamAbbr,
  healthyStarters,
  injuredStarters,
  depth,
}: {
  teamAbbr: string;
  healthyStarters: NflPlayerView[];
  injuredStarters: NflPlayerView[];
  depth: NflPlayerView[];
}) {
  const starterCount = healthyStarters.length + injuredStarters.length;
  return (
    <>
      <Block teamAbbr={teamAbbr} players={healthyStarters} />
      <Block heading="Injured" teamAbbr={teamAbbr} players={injuredStarters} />
      <Block
        heading={
          injuredStarters.length > 0 && starterCount > 0 ? "Depth" : undefined
        }
        teamAbbr={teamAbbr}
        players={depth}
      />
    </>
  );
}

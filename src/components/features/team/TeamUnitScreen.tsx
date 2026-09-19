import { NflPlayerRows } from "@/components/NflPlayerRows";
import { splitRosterPlayers } from "@/lib/team-research";
import { TeamBack } from "./TeamBack";
import { TeamStartersToggle } from "./TeamStartersToggle";
import { unitTitle } from "./team-paths";
import type { NflPlayerView } from "@/lib/team-research";
import type { TeamPageData, TeamUnitKey } from "./types";

function playersFor(data: TeamPageData, unit: TeamUnitKey): NflPlayerView[] {
  if (unit === "offence") return data.offence;
  if (unit === "defence") return data.defence;
  return data.special;
}

export function TeamUnitScreen({
  data,
  unit,
  showAll,
}: {
  data: TeamPageData;
  unit: TeamUnitKey;
  showAll: boolean;
}) {
  const players = playersFor(data, unit);
  const { starters } = splitRosterPlayers(players);
  const hasStarters = starters.length > 0;
  const shown = hasStarters && !showAll ? starters : players;
  const title = unitTitle(unit);

  return (
    <div className="team-research space-y-5 min-w-0 text-base leading-relaxed">
      <TeamBack abbr={data.abbr} name={data.header.name} />
      <section className="card-glass p-4 space-y-3">
        <div>
          <h1 className="text-xl font-semibold text-gold-400">{title}</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Tap a name for college, role, and any injury note.
            {data.rolesApproximate ? " Roles are approximate." : ""}
          </p>
        </div>
        {hasStarters && (
          <TeamStartersToggle
            startersOnly={!showAll}
            starterCount={starters.length}
          />
        )}
        {shown.length === 0 ? (
          <p className="text-base text-[var(--text-muted)]">
            {unit === "special-teams"
              ? "None listed. ESPN often skips returners as their own spots."
              : "None listed yet."}
          </p>
        ) : (
          <NflPlayerRows teamAbbr={data.abbr} players={shown} />
        )}
      </section>
    </div>
  );
}

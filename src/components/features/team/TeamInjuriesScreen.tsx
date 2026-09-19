import { TeamBack } from "./TeamBack";
import { TeamInjuryList } from "./TeamInjuryList";
import type { TeamPageData } from "./types";

export function TeamInjuriesScreen({ data }: { data: TeamPageData }) {
  const { injuries, abbr, offence, defence, special } = data;
  const players = [...offence, ...defence, ...special];
  return (
    <div className="team-research space-y-5 min-w-0 text-base leading-relaxed">
      <TeamBack abbr={abbr} name={data.header.name} />
      <section className="card-glass p-4 space-y-3">
        <h1 className="text-xl font-semibold text-gold-400">Injuries</h1>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
          ESPN public report (Out, Doubtful, Questionable, IR, suspension). Not
          the official NFL list and not medical advice.
        </p>
        {injuries.failed ? (
          <p className="text-base text-[var(--text-muted)]">
            Couldn&apos;t load the ESPN feed right now. Check{" "}
            <a href={injuries.espnInjuriesUrl} target="_blank" rel="noopener noreferrer" className="text-gold-400 underline underline-offset-2">
              ESPN
            </a>
            {" · "}
            <a href={injuries.nflInjuriesUrl} target="_blank" rel="noopener noreferrer" className="text-gold-400 underline underline-offset-2">
              NFL.com
            </a>
            .
          </p>
        ) : injuries.injuries.length === 0 ? (
          <p className="text-base text-[var(--text-muted)]">
            No Out / Doubtful / Questionable / IR / suspension names on the
            current ESPN report for this team.
          </p>
        ) : (
          <TeamInjuryList
            rows={injuries.injuries}
            teamAbbr={abbr}
            players={players}
          />
        )}
      </section>
    </div>
  );
}

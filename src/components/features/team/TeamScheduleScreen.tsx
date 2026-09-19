import { TeamBack } from "./TeamBack";
import { TeamScheduleList } from "./TeamScheduleList";
import type { TeamScheduleData } from "./load-team-schedule";

export function TeamScheduleScreen({ data }: { data: TeamScheduleData }) {
  return (
    <div className="team-research space-y-5 min-w-0 text-base leading-relaxed">
      <TeamBack abbr={data.abbr} name={data.name} />
      <section className="space-y-3">
        <div>
          <h1 className="text-xl font-semibold text-gold-400">Schedule</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Every game this season, in week order. Finished games show the
            score and whether {data.abbr} won or lost.
          </p>
        </div>
        <TeamScheduleList games={data.games} />
      </section>
    </div>
  );
}

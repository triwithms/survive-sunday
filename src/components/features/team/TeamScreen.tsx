import { TeamCoach } from "./TeamCoach";
import { TeamHeader } from "./TeamHeader";
import { TeamLookCloser } from "./TeamLookCloser";
import { TeamNav } from "./TeamNav";
import { TeamStyle } from "./TeamStyle";
import { TeamThisWeek } from "./TeamThisWeek";
import type { TeamPageData } from "./types";

export function TeamScreen({ data }: { data: TeamPageData }) {
  return (
    <div className="team-research space-y-5 min-w-0 text-base leading-relaxed">
      <TeamNav />
      <TeamHeader header={data.header} />
      {data.thisWeek && <TeamThisWeek week={data.thisWeek} />}
      {data.style && <TeamStyle style={data.style} />}
      <TeamCoach coach={data.coach} abbr={data.abbr} />
      <TeamLookCloser data={data} />
    </div>
  );
}

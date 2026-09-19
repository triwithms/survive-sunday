import "server-only";
import { normAbbr } from "@/lib/espn";
import { loadInjuryCache } from "@/lib/injury-cache";
import {
  countInjuries,
  type InjuryCounts,
  type LiveInjury,
} from "@/lib/injury-parse";

export type {
  EspnInjuriesPayload,
  InjuryCounts,
  LiveInjury,
} from "@/lib/injury-parse";
export { countInjuries, parseEspnInjuries } from "@/lib/injury-parse";

export type TeamInjuriesResult = {
  injuries: LiveInjury[];
  counts: InjuryCounts;
  failed: boolean;
  fetchedAt: number | null;
  sourceLabel: string;
  espnInjuriesUrl: string;
  nflInjuriesUrl: string;
};

export async function getTeamInjuries(abbr: string): Promise<TeamInjuriesResult> {
  const key = normAbbr(abbr);
  const espn = key === "WAS" ? "wsh" : key.toLowerCase();
  const urls = {
    espnInjuriesUrl: `https://www.espn.com/nfl/team/injuries/_/name/${espn}`,
    nflInjuriesUrl: "https://www.nfl.com/injuries/",
  };
  const cache = await loadInjuryCache();
  const injuries = cache.value.byTeam.get(key) ?? [];
  return {
    injuries,
    counts: countInjuries(injuries),
    failed: cache.failed,
    fetchedAt: cache.fetchedAt,
    sourceLabel: "ESPN public injury report",
    ...urls,
  };
}

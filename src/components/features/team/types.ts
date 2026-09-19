import type { TeamCoachResult } from "@/lib/team-coaches";
import type { TeamInjuriesResult } from "@/lib/live-injuries";
import type { NflPlayerView, TeamNewsResult } from "@/lib/team-research";

export type TeamHeaderView = {
  abbr: string;
  name: string;
  conference: string;
  division: string;
  logoUrl: string | null;
  record: string;
  winPct: string;
  standing: string | null;
  priorYear: string | null;
  pointsFor: number;
  pointsAgainst: number;
};

export type TeamThisWeekView = {
  opponentAbbr: string;
  atHome: boolean;
  kickoffLabel: string;
  scoreLine: string | null;
  favouriteLabel: string | null;
};

export type TeamStyleView = {
  offence: string;
  defence: string;
  runPass: string;
  basis: string | null;
};

export type TeamPageData = {
  abbr: string;
  header: TeamHeaderView;
  thisWeek: TeamThisWeekView | null;
  style: TeamStyleView | null;
  coach: TeamCoachResult;
  offence: NflPlayerView[];
  defence: NflPlayerView[];
  special: NflPlayerView[];
  rolesApproximate: boolean;
  injuries: TeamInjuriesResult;
  news: TeamNewsResult;
};

export type { TeamSection, TeamUnitKey } from "./team-paths";

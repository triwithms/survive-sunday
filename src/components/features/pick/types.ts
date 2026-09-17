import type { StandingBits } from "@/lib/matchup-meta";

export type PickSide = {
  abbr: string;
  name: string;
  logoUrl: string | null;
  alreadyUsed: boolean;
  priorYearRank: number | null;
  standing: StandingBits | null;
};

export type PickMatchup = {
  id: string;
  kickoff: string;
  status: string;
  scoreAway: number | null;
  scoreHome: number | null;
  note: string | null;
  spreadHome: number | null;
  spreadAway: number | null;
  mlHome: number | null;
  mlAway: number | null;
  away: PickSide;
  home: PickSide;
};

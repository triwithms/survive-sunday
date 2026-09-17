export type ScoreGameCardGame = {
  id: string;
  awayAbbr: string;
  homeAbbr: string;
  scoreAway: number | null;
  scoreHome: number | null;
  status: string;
  note: string | null;
  kickoff: Date | string;
  network: string | null;
  awayLogoUrl: string | null;
  homeLogoUrl: string | null;
};

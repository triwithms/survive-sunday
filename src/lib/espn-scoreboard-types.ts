import type { GameOdds } from "@/lib/odds";

export type EspnGameSnapshot = {
  eventId: string | null;
  awayAbbr: string;
  homeAbbr: string;
  status: "scheduled" | "live" | "final";
  scoreAway: number | null;
  scoreHome: number | null;
  clockLabel: string | null;
  situationLabel: string | null;
  timeoutsAway: number | null;
  timeoutsHome: number | null;
  detail: string | null;
  odds: GameOdds | null;
  /** ESPN event date; used for slate/kickoff hashing, not live scores. */
  kickoffIso: string | null;
};

type EspnStatus = {
  displayClock?: string;
  period?: number;
  type?: { name?: string; state?: string; shortDetail?: string; detail?: string };
};

export type EspnScoreboardPayload = {
  events?: Array<{
    id?: string;
    date?: string;
    competitions?: Array<{
      competitors?: Array<{
        homeAway: string;
        score?: string;
        team: { abbreviation: string };
      }>;
      odds?: unknown;
      situation?: {
        possession?: string;
        shortDownDistanceText?: string;
        possessionText?: string;
        downDistanceText?: string;
        down?: number;
        distance?: number;
        homeTimeouts?: number;
        awayTimeouts?: number;
      };
      status?: EspnStatus;
    }>;
    status?: EspnStatus;
  }>;
};

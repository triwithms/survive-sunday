import { normAbbr } from "@/lib/espn-teams";

export type ScoringPlayDto = {
  teamAbbr: string;
  type: string;
  text: string;
  period: string | null;
  clock: string | null;
  awayScore: number;
  homeScore: number;
};

export type DriveHighlightDto = {
  teamAbbr: string;
  description: string;
  result: string | null;
  yards: number | null;
};

export type LeaderDto = {
  category: string;
  player: string;
  teamAbbr: string;
  value: string;
};

export type ParsedEspnSummary = {
  scoringPlays: ScoringPlayDto[];
  currentDrive: DriveHighlightDto | null;
  recentDrives: DriveHighlightDto[];
  leaders: LeaderDto[];
};

export type GameDetailDto = ParsedEspnSummary & {
  awayAbbr: string;
  homeAbbr: string;
  scoreAway: number | null;
  scoreHome: number | null;
  status: string;
  note: string | null;
  timeoutsAway: number | null;
  timeoutsHome: number | null;
};

type RawScoringPlay = {
  text?: string;
  awayScore?: number;
  homeScore?: number;
  type?: { text?: string; abbreviation?: string };
  scoringType?: { displayName?: string; abbreviation?: string };
  period?: { number?: number };
  clock?: { displayValue?: string };
  team?: { abbreviation?: string };
};

type RawDrive = {
  description?: string;
  result?: string;
  displayResult?: string;
  shortDisplayResult?: string;
  yards?: number;
  team?: { abbreviation?: string };
};

type RawLeaderBlock = {
  team?: { abbreviation?: string };
  leaders?: Array<{
    name?: string;
    displayName?: string;
    leaders?: Array<{
      displayValue?: string;
      athlete?: { displayName?: string; shortName?: string };
    }>;
  }>;
};

const LEADER_CATEGORIES: Record<string, string> = {
  passingYards: "Passing",
  rushingYards: "Rushing",
  receivingYards: "Receiving",
  totalTackles: "Tackles",
  sacks: "Sacks",
};

function periodLabel(n: number | undefined): string | null {
  if (n == null || !Number.isFinite(n)) return null;
  if (n > 4) return n === 5 ? "OT" : `OT${n - 4}`;
  return `Q${n}`;
}

function driveDto(d: RawDrive | null | undefined): DriveHighlightDto | null {
  if (!d) return null;
  const teamAbbr = d.team?.abbreviation ? normAbbr(d.team.abbreviation) : "";
  const description = d.description?.trim() || "";
  const result =
    d.displayResult?.trim() ||
    d.shortDisplayResult?.trim() ||
    d.result?.trim() ||
    null;
  if (!teamAbbr && !description && !result) return null;
  return {
    teamAbbr: teamAbbr || "—",
    description: description || result || "Drive",
    result,
    yards: typeof d.yards === "number" ? d.yards : null,
  };
}

/** Pull scoring / drives / leaders from ESPN summary JSON. Does not invent rows. */
export function parseEspnGameSummary(payload: {
  scoringPlays?: RawScoringPlay[];
  drives?: { current?: RawDrive; previous?: RawDrive[] };
  leaders?: RawLeaderBlock[];
}): ParsedEspnSummary {
  const scoringPlays: ScoringPlayDto[] = [];
  for (const play of payload.scoringPlays || []) {
    const text = play.text?.trim();
    if (!text) continue;
    const abbr = play.team?.abbreviation
      ? normAbbr(play.team.abbreviation)
      : "—";
    scoringPlays.push({
      teamAbbr: abbr,
      type:
        play.scoringType?.abbreviation ||
        play.type?.abbreviation ||
        play.type?.text ||
        "Score",
      text,
      period: periodLabel(play.period?.number),
      clock: play.clock?.displayValue?.trim() || null,
      awayScore: Number.isFinite(play.awayScore) ? Number(play.awayScore) : 0,
      homeScore: Number.isFinite(play.homeScore) ? Number(play.homeScore) : 0,
    });
  }

  const currentDrive = driveDto(payload.drives?.current);
  const recentDrives: DriveHighlightDto[] = [];
  const prev = payload.drives?.previous || [];
  for (const d of prev.slice(-6).reverse()) {
    const row = driveDto(d);
    if (row) recentDrives.push(row);
  }

  const leaders: LeaderDto[] = [];
  for (const block of payload.leaders || []) {
    const teamAbbr = block.team?.abbreviation
      ? normAbbr(block.team.abbreviation)
      : "—";
    for (const cat of block.leaders || []) {
      const key = cat.name || "";
      const label = LEADER_CATEGORIES[key];
      if (!label) continue;
      const top = cat.leaders?.[0];
      const player =
        top?.athlete?.displayName?.trim() ||
        top?.athlete?.shortName?.trim() ||
        "";
      const value = top?.displayValue?.trim() || "";
      if (!player || !value) continue;
      leaders.push({ category: label, player, teamAbbr, value });
    }
  }

  return { scoringPlays, currentDrive, recentDrives, leaders };
}

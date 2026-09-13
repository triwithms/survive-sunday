import { abbrFromEspnTeamId, normAbbr } from "@/lib/espn-teams";

export type LiveInjury = {
  teamAbbr: string;
  player: string;
  position: string;
  status: string;
  injury: string;
  updated: string | null;
  comment: string | null;
  playerUrl: string | null;
};

export type InjuryCounts = {
  out: number;
  doubtful: number;
  questionable: number;
  ir: number;
  suspension: number;
};

type EspnAthlete = {
  displayName?: string;
  shortName?: string;
  position?: { abbreviation?: string };
  team?: { id?: string; abbreviation?: string };
  links?: Array<{ rel?: string[]; href?: string }>;
};

type EspnInjuryItem = {
  status?: string;
  date?: string;
  shortComment?: string;
  athlete?: EspnAthlete;
  details?: { type?: string; detail?: string };
  type?: { description?: string };
};

type EspnTeamInjuries = {
  id?: string;
  displayName?: string;
  injuries?: EspnInjuryItem[];
};

export type EspnInjuriesPayload = {
  timestamp?: string;
  status?: string;
  season?: { year?: number };
  injuries?: EspnTeamInjuries[];
};

const WATCH_STATUSES = new Set([
  "out",
  "doubtful",
  "questionable",
  "injured reserve",
  "ir",
  "suspension",
  "suspended",
  "pup",
  "nfi",
]);

const STATUS_RANK: Record<string, number> = {
  out: 0,
  doubtful: 1,
  questionable: 2,
  suspension: 3,
  suspended: 3,
  "injured reserve": 4,
  ir: 4,
  pup: 5,
  nfi: 6,
};

export function emptyInjuryCounts(): InjuryCounts {
  return { out: 0, doubtful: 0, questionable: 0, ir: 0, suspension: 0 };
}

export function countInjuries(rows: LiveInjury[]): InjuryCounts {
  const counts = emptyInjuryCounts();
  for (const row of rows) {
    const s = row.status.toLowerCase();
    if (s === "out") counts.out += 1;
    else if (s === "doubtful") counts.doubtful += 1;
    else if (s === "questionable") counts.questionable += 1;
    else if (s === "injured reserve" || s === "ir") counts.ir += 1;
    else if (s === "suspension" || s === "suspended") counts.suspension += 1;
  }
  return counts;
}

function usefulComment(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const t = raw.trim();
  if (t.length < 12) return null;
  if (/^(ir|pup|nfi|reserve-sus|reserve-nr|reserve-ir)\b/i.test(t)) return null;
  return t;
}

function playerCardUrl(athlete: EspnAthlete | undefined): string | null {
  const links = athlete?.links || [];
  const card = links.find((l) => (l.rel || []).includes("playercard"));
  const href = card?.href || links[0]?.href;
  if (!href || !href.startsWith("https://")) return null;
  return href;
}

function normalizeStatus(raw: string | undefined): string {
  const s = (raw || "").trim();
  if (!s) return "Unknown";
  if (/^ir$/i.test(s)) return "Injured Reserve";
  if (/^susp/i.test(s)) return "Suspension";
  return s;
}

function isWatchStatus(status: string): boolean {
  return WATCH_STATUSES.has(status.toLowerCase());
}

/**
 * Parse ESPN league injuries JSON into compact rows.
 * Drops "Active" (cleared) entries — those are not current absences.
 * Never invents players; skips items without a name + team.
 */
export function parseEspnInjuries(payload: EspnInjuriesPayload): LiveInjury[] {
  const out: LiveInjury[] = [];
  for (const team of payload.injuries || []) {
    const fromId = abbrFromEspnTeamId(team.id);
    for (const item of team.injuries || []) {
      const status = normalizeStatus(item.status);
      if (!isWatchStatus(status)) continue;
      const athlete = item.athlete;
      const player = (athlete?.displayName || athlete?.shortName || "").trim();
      if (!player) continue;
      const teamAbbr =
        fromId ||
        (athlete?.team?.abbreviation
          ? normAbbr(athlete.team.abbreviation)
          : abbrFromEspnTeamId(athlete?.team?.id));
      if (!teamAbbr) continue;
      const injuryType = (item.details?.type || "").trim();
      const injuryDetail = (item.details?.detail || "").trim();
      const injury =
        injuryType &&
        injuryDetail &&
        injuryDetail.toLowerCase() !== "not specified"
          ? `${injuryType} (${injuryDetail})`
          : injuryType || item.type?.description || "Undisclosed";
      out.push({
        teamAbbr,
        player,
        position: (athlete?.position?.abbreviation || "").trim() || "—",
        status,
        injury,
        updated: item.date ? String(item.date) : null,
        comment: usefulComment(item.shortComment),
        playerUrl: playerCardUrl(athlete),
      });
    }
  }
  out.sort((a, b) => {
    const ra = STATUS_RANK[a.status.toLowerCase()] ?? 50;
    const rb = STATUS_RANK[b.status.toLowerCase()] ?? 50;
    if (ra !== rb) return ra - rb;
    return a.player.localeCompare(b.player, "en-CA");
  });
  return out;
}

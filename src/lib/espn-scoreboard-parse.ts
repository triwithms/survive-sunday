import { formatEspnSituation } from "@/lib/game-display";
import { parseEspnCompetitionOdds } from "@/lib/odds";
import { normAbbr } from "@/lib/espn-teams";
import { payloadHash } from "@/lib/payload-hash";
import type {
  EspnGameSnapshot,
  EspnScoreboardPayload,
} from "@/lib/espn-scoreboard-types";

export type { EspnGameSnapshot, EspnScoreboardPayload };

function mapEspnStatus(
  state: string | undefined,
  name: string | undefined
): EspnGameSnapshot["status"] {
  const s = (state || "").toLowerCase();
  const n = (name || "").toUpperCase();
  if (s === "post" || n.includes("FINAL")) return "final";
  if (s === "in" || n.includes("IN_PROGRESS") || n.includes("HALFTIME") || n.includes("END_PERIOD")) {
    return "live";
  }
  return "scheduled";
}

function periodClock(
  period: number | undefined,
  displayClock: string | undefined,
  shortDetail: string | undefined,
  status: EspnGameSnapshot["status"]
): string | null {
  if (status === "final") return shortDetail || "Final";
  if (status === "scheduled") return shortDetail || null;
  if (shortDetail && /Q|Half|OT|END/i.test(shortDetail)) return shortDetail;
  if (period && displayClock) {
    const q = period > 4 ? `OT${period - 4}` : `Q${period}`;
    return `${q} ${displayClock}`;
  }
  return shortDetail || null;
}

/** Matchups + kickoffs only. Live scores / clocks are not part of the slate hash. */
export function slateFingerprint(snaps: EspnGameSnapshot[]): string {
  return payloadHash(
    [...snaps]
      .map((s) => ({
        a: s.awayAbbr,
        h: s.homeAbbr,
        k: s.kickoffIso || (s.status === "scheduled" ? s.clockLabel ?? "" : ""),
      }))
      .sort((x, y) => `${x.a}@${x.h}`.localeCompare(`${y.a}@${y.h}`))
  );
}

export function parseEspnScoreboard(data: EspnScoreboardPayload): EspnGameSnapshot[] {
  const out: EspnGameSnapshot[] = [];
  for (const event of data.events || []) {
    const comp = event.competitions?.[0];
    const statusObj = comp?.status || event.status;
    const type = statusObj?.type;
    const status = mapEspnStatus(type?.state, type?.name);
    const by = new Map((comp?.competitors || []).map((c) => [c.homeAway, c] as const));
    const away = by.get("away");
    const home = by.get("home");
    if (!away || !home) continue;
    const awayAbbr = normAbbr(away.team.abbreviation);
    const homeAbbr = normAbbr(home.team.abbreviation);
    const scoreAway = away.score != null && away.score !== "" ? Number(away.score) : null;
    const scoreHome = home.score != null && home.score !== "" ? Number(home.score) : null;
    out.push({
      eventId: event.id ? String(event.id) : null,
      awayAbbr,
      homeAbbr,
      status,
      scoreAway: Number.isFinite(scoreAway as number) ? scoreAway : null,
      scoreHome: Number.isFinite(scoreHome as number) ? scoreHome : null,
      clockLabel: periodClock(statusObj?.period, statusObj?.displayClock, type?.shortDetail, status),
      situationLabel: status === "live" ? formatEspnSituation(comp?.situation) : null,
      timeoutsAway: typeof comp?.situation?.awayTimeouts === "number" ? comp.situation.awayTimeouts : null,
      timeoutsHome: typeof comp?.situation?.homeTimeouts === "number" ? comp.situation.homeTimeouts : null,
      detail: type?.detail || type?.shortDetail || null,
      odds: parseEspnCompetitionOdds(comp?.odds, homeAbbr, awayAbbr),
      kickoffIso: event.date ? String(event.date) : null,
    });
  }
  return out;
}

export function scoreboardHasLive(snaps: EspnGameSnapshot[]): boolean {
  return snaps.some((s) => s.status === "live");
}

import { MISSED_TEAM } from "@/lib/grading";
import type { HomeRow } from "./types";

export function buildHomeRows(
  sorted: Array<{
    id: string;
    nickname: string;
    realName: string | null;
    status: string;
    autoPickStamps: number | null;
    picks: Array<{
      source: string;
      teamAbbr: string;
      result: string | null;
      game: { awayAbbr: string; homeAbbr: string } | null;
    }>;
  }>
): HomeRow[] {
  return sorted.map((m) => {
    const pickRaw = m.picks[0];
    const valid =
      pickRaw &&
      pickRaw.source !== "missed" &&
      pickRaw.teamAbbr !== MISSED_TEAM
        ? pickRaw
        : undefined;
    return {
      id: m.id,
      nickname: m.nickname,
      realName: m.realName,
      status: m.status,
      autoPickStamps: m.autoPickStamps,
      pick: valid
        ? {
            teamAbbr: valid.teamAbbr,
            result: valid.result,
            source: valid.source,
            game: valid.game,
          }
        : null,
      missed: Boolean(
        pickRaw &&
          (pickRaw.source === "missed" || pickRaw.teamAbbr === MISSED_TEAM)
      ),
      missedResult: pickRaw?.result ?? null,
    };
  });
}

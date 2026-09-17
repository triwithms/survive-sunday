import { isUserPick } from "@/lib/pick-change";
import { shouldApplyMissedPick } from "@/lib/pool-rules";

export type CensusMember = {
  id: string;
  nickname: string;
  status: string;
  role?: string;
  isParticipant?: boolean;
  playingFromWeek?: number | null;
};

export type CensusPick = {
  membershipId: string;
  teamAbbr?: string | null;
  source?: string | null;
};

export type PickCensus = {
  weekNumber: number;
  shouldPick: number;
  submitted: number;
  outstanding: number;
  outstandingNicknames: string[];
};

/** Who should pick this week, who has a real pick, who is still outstanding. */
export function buildPickCensus(
  weekNumber: number,
  members: CensusMember[],
  picks: CensusPick[]
): PickCensus {
  const byId = new Map(picks.map((p) => [p.membershipId, p]));
  const due = members.filter((m) => shouldApplyMissedPick(m, weekNumber));
  const outstandingNicknames: string[] = [];
  let submitted = 0;
  for (const m of due) {
    if (isUserPick(byId.get(m.id))) submitted += 1;
    else outstandingNicknames.push(m.nickname);
  }
  outstandingNicknames.sort((a, b) =>
    a.localeCompare(b, "en-CA", { sensitivity: "base" })
  );
  return {
    weekNumber,
    shouldPick: due.length,
    submitted,
    outstanding: outstandingNicknames.length,
    outstandingNicknames,
  };
}

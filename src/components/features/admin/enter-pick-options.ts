import { formatSeatLabel } from "@/lib/claim-seat";
import type { EnterPickMember, EnterPickTeam } from "./enter-pick-types";

const MISS = "MISS";

export function enterPickLabel(m: EnterPickMember): string {
  const who = formatSeatLabel(m.nickname, m.realName);
  if (m.status === "eliminated") return `${who} — eliminated`;
  if (m.status === "one_loss") return `${who} — one loss`;
  return who;
}

export function memberWeekPick(
  members: EnterPickMember[],
  memberId: string,
  weekNumber: number
): string | null {
  return pickForWeek(
    members.find((m) => m.id === memberId),
    weekNumber
  );
}

export function pickForWeek(
  member: EnterPickMember | undefined,
  weekNumber: number
): string | null {
  const abbr = member?.picks.find((p) => p.weekNumber === weekNumber)?.teamAbbr;
  return abbr && abbr !== MISS ? abbr : null;
}

/** Teams playing this week that this seat has not already used. */
export function unusedTeamsForWeek(opts: {
  weekTeams: EnterPickTeam[];
  member?: EnterPickMember;
  weekNumber: number;
}): EnterPickTeam[] {
  const member = opts.member;
  if (!member) return opts.weekTeams;
  const current = pickForWeek(member, opts.weekNumber);
  const used = new Set(
    member.picks
      .filter((p) => p.weekNumber !== opts.weekNumber && p.teamAbbr !== MISS)
      .map((p) => p.teamAbbr)
  );
  for (const abbr of member.usedTeams) {
    if (abbr !== current && abbr !== MISS) used.add(abbr);
  }
  return opts.weekTeams.filter((t) => !used.has(t.abbr));
}

export function weeksForMember<T extends { number: number }>(
  weeks: T[],
  member: EnterPickMember | undefined
): T[] {
  if (!member) return weeks;
  const allowed = new Set(member.allowedWeeks);
  return weeks.filter((w) => allowed.has(w.number));
}

export function snapEnterPickWeek(
  preferred: number,
  allowed: number[],
  fallback: number
): number {
  if (allowed.includes(preferred)) return preferred;
  if (allowed.includes(fallback)) return fallback;
  return allowed[allowed.length - 1] ?? fallback;
}

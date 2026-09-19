import { teamLogoUrl } from "@/lib/espn-teams";
import { MISSED_TEAM } from "@/lib/grading";
import { isAlive, resolveSeasonWinners } from "@/lib/tiebreak";
import { isSingleEliminationWeek } from "@/lib/pool-rules";
import type { PlayerPickWeek } from "@/lib/next-week-picks";
import { boardLockLine, boardSortLine } from "./board-copy";
import type { BoardRow, BoardScreenProps } from "./types";

type Member = {
  id: string;
  nickname: string;
  realName: string | null;
  status: string;
  autoPickStamps: number | null;
  losses: number;
  weeksSurvived: number;
  mulliganRemaining: boolean;
};

type PickRow = {
  membershipId: string;
  source: string;
  teamAbbr: string;
  result: string | null;
};

export function assembleBoardPage(args: {
  me: { id: string; role: string; status: string; pool: { singleEliminationFromWeek: number | null } };
  currentWeek: number;
  week: { number: number; label: string; lockAt: Date; lockOverrideAt: Date | null } | null;
  sorted: Member[];
  participants: Member[];
  pickByMember: Map<string, PickRow>;
  logoByAbbr: Map<string, string | null>;
  locked: boolean;
  playing: boolean;
  canChangePick: boolean;
  decision: PlayerPickWeek;
}): BoardScreenProps {
  void args.decision;
  void args.playing;
  const { me, week, sorted, pickByMember, logoByAbbr } = args;
  const weekLabel = week?.label ?? `Week ${args.currentWeek}`;
  const winners = resolveSeasonWinners(args.participants);
  const revealAllPicks = args.locked;
  const rows: BoardRow[] = sorted.map((m) => {
    const pickRaw = pickByMember.get(m.id);
    const pick =
      pickRaw && pickRaw.source !== "missed" && pickRaw.teamAbbr !== MISSED_TEAM
        ? pickRaw : undefined;
    return {
      ...m,
      pick: pick
        ? {
            teamAbbr: pick.teamAbbr,
            result: pick.result,
            logoUrl: teamLogoUrl(pick.teamAbbr, logoByAbbr.get(pick.teamAbbr)),
          }
        : null,
    };
  });
  return {
    heading: {
      weekLabel,
      stillInCount: sorted.filter((m) => isAlive(m.status)).length,
      undefeatedCount: sorted.filter((m) => m.status === "undefeated").length,
      eliminatedCount: sorted.filter((m) => m.status === "eliminated").length,
      pickRowCount: sorted.length,
      lockLine: boardLockLine(week, args.locked, args.canChangePick),
      sortLine: boardSortLine(revealAllPicks),
      cta: null,
    },
    rows,
    selfId: me.id,
    revealAllPicks,
    canChangePick: args.canChangePick,
    oneAndDone: isSingleEliminationWeek(me.pool.singleEliminationFromWeek, args.currentWeek),
    tiebreak: {
      weekLabel,
      soleNickname: winners.sole?.nickname ?? null,
      sharedNicknames: winners.shared.map((m) => m.nickname),
      showNoOfficial: !winners.sole && winners.shared.length === 0 &&
        winners.officialEligible.length === 0 &&
        args.participants.some((m) => isAlive(m.status)),
    },
  };
}

import { prisma } from "./db";
import { WEEK_WRAP_BOARD_URL } from "./week-wrap-copy";
import { weekWrapPlayers } from "./week-wrap-players";
import { loadWeekWrapSettings } from "./week-wrap-settings";
import {
  DEFAULT_WEEK_WRAP_SETTINGS,
  weekNumbersFromDedupeKeys,
  type WeekWrapPanelData,
  type WeekWrapWeekOption,
} from "./week-wrap-types";
import {
  allGamesFinal,
  isEligibleNoonDayAfter,
  preferredWrapWeek,
} from "./week-wrap-when";

export async function loadWeekWrapPanel(
  poolId: string,
  now = new Date()
): Promise<WeekWrapPanelData> {
  try {
    return await loadWeekWrapPanelUnsafe(poolId, now);
  } catch (error) {
    console.error("[week-wrap] load failed", error);
    return {
      boardUrl: WEEK_WRAP_BOARD_URL,
      selectedWeek: 1,
      tone: DEFAULT_WEEK_WRAP_SETTINGS.tone,
      blocks: { ...DEFAULT_WEEK_WRAP_SETTINGS.blocks },
      emailOverride: "",
      smsOverride: "",
      weeks: [],
    };
  }
}

async function loadWeekWrapPanelUnsafe(
  poolId: string,
  now: Date
): Promise<WeekWrapPanelData> {
  const settings = await loadWeekWrapSettings(poolId);
  const [members, weeks, sends] = await Promise.all([
    prisma.membership.findMany({
      where: { poolId },
      select: {
        id: true,
        nickname: true,
        status: true,
        role: true,
        isParticipant: true,
      },
    }),
    prisma.week.findMany({
      where: { poolId },
      orderBy: { number: "desc" },
      select: {
        number: true,
        games: { select: { status: true, kickoff: true } },
        picks: {
          select: { membershipId: true, teamAbbr: true, result: true },
        },
      },
    }),
    prisma.notificationSend.findMany({
      where: {
        type: "weekWrap",
        dedupeKey: { startsWith: `wrap:${poolId}:w` },
      },
      select: { dedupeKey: true },
    }),
  ]);
  const sent = weekNumbersFromDedupeKeys(
    sends.map((row) => row.dedupeKey),
    poolId
  );
  const skipped = new Set(settings.skippedWeeks);
  const options: WeekWrapWeekOption[] = weeks.map((week) => ({
    number: week.number,
    allFinal: allGamesFinal(week.games),
    eligible: isEligibleNoonDayAfter(week.games, now),
    skipped: skipped.has(week.number),
    sent: sent.has(week.number),
    players: weekWrapPlayers(members, week.picks),
  }));
  return {
    boardUrl: WEEK_WRAP_BOARD_URL,
    selectedWeek: preferredWrapWeek(options, options[0]?.number ?? 1),
    tone: settings.tone,
    blocks: settings.blocks,
    emailOverride: settings.emailOverride,
    smsOverride: settings.smsOverride,
    weeks: options,
  };
}

import { prisma } from "./db";
import { weekCountsForPool } from "./pool-start-week";
import { overlayPoolWeeks } from "./slate-games";
import { showTeamLogosFor } from "./team-logos";
import { loadWrapAudience } from "./week-wrap-audience";
import { emptyWeekWrapPanel } from "./week-wrap-empty";
import { loadWrapNfl } from "./week-wrap-extras";
import { weekNumbersFromDedupeKeys } from "./week-wrap-parse";
import { WEEK_WRAP_BOARD_URL } from "./week-wrap-sections";
import { loadWeekWrapSettings } from "./week-wrap-settings";
import { loadWrapSeason, wrapWeekView } from "./week-wrap-snapshot";
import { preferredWrapWeek } from "./week-wrap-status";
import type { WeekWrapPanelData, WeekWrapWeekOption } from "./week-wrap-types";
import { allGamesFinal, isEligibleNoonDayAfter } from "./week-wrap-when";

export async function loadWeekWrapPanel(
  poolId: string,
  now = new Date()
): Promise<WeekWrapPanelData> {
  try {
    return await loadWeekWrapPanelUnsafe(poolId, now);
  } catch (error) {
    console.error("[week-wrap] load failed", error);
    return emptyWeekWrapPanel();
  }
}

async function loadWeekWrapPanelUnsafe(
  poolId: string,
  now: Date
): Promise<WeekWrapPanelData> {
  const settings = await loadWeekWrapSettings(poolId);
  const [season, weeks, sends, nfl] = await Promise.all([
    loadWrapSeason(poolId),
    prisma.week.findMany({
      where: { poolId },
      orderBy: { number: "desc" },
      select: { number: true, games: { select: { status: true, kickoff: true } } },
    }),
    prisma.notificationSend.findMany({
      where: { type: "weekWrap", dedupeKey: { startsWith: `wrap:${poolId}:w` } },
      select: { dedupeKey: true },
    }),
    loadWrapNfl({ sync: false }),
  ]);
  const slateWeeks = await overlayPoolWeeks(poolId, weeks);
  const sent = weekNumbersFromDedupeKeys(
    sends.map((row) => row.dedupeKey),
    poolId
  );
  const skipped = new Set(settings.skippedWeeks);
  const options: WeekWrapWeekOption[] = slateWeeks
    .filter((week) => weekCountsForPool(season?.startWeek, week.number))
    .map((week) => {
      const view = season ? wrapWeekView(season, week.number) : { players: [], board: [] };
      return {
        number: week.number,
        allFinal: allGamesFinal(week.games),
        eligible: isEligibleNoonDayAfter(week.games, now),
        skipped: skipped.has(week.number),
        sent: sent.has(week.number),
        players: view.players,
        board: view.board,
      };
    });
  const selectedWeek = preferredWrapWeek(options, options[0]?.number ?? 1);
  const selected = options.find((week) => week.number === selectedWeek);
  return {
    boardUrl: WEEK_WRAP_BOARD_URL,
    selectedWeek,
    tone: settings.tone,
    blocks: settings.blocks,
    emailOverride: settings.emailOverride,
    smsOverride: settings.smsOverride,
    weeks: options,
    board: selected?.board ?? [],
    nfl,
    audience: await loadWrapAudience(poolId),
    teamLogos: season?.teamLogos ?? showTeamLogosFor(null),
  };
}

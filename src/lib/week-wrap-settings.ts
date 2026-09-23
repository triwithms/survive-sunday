import { prisma } from "./db";
import { ensureWeekWrapTable } from "./week-wrap-schema";
import {
  DEFAULT_WEEK_WRAP_BLOCKS,
  DEFAULT_WEEK_WRAP_SETTINGS,
  isWeekWrapTone,
  parseSkippedWeeks,
  type WeekWrapSettings,
} from "./week-wrap-types";

function cloneDefaults(): WeekWrapSettings {
  return {
    ...DEFAULT_WEEK_WRAP_SETTINGS,
    blocks: { ...DEFAULT_WEEK_WRAP_BLOCKS },
    skippedWeeks: [],
  };
}

export async function loadWeekWrapSettings(
  poolId: string
): Promise<WeekWrapSettings> {
  await ensureWeekWrapTable(prisma);
  const row = await prisma.weekWrapSetting.findUnique({ where: { poolId } });
  if (!row) return cloneDefaults();
  return {
    tone: isWeekWrapTone(row.tone) ? row.tone : "facts",
    blocks: {
      roster: row.showRoster,
      picks: row.showPicks,
      board: row.showBoardLink,
      drama: row.showDrama,
    },
    emailOverride: row.emailOverride,
    smsOverride: row.smsOverride,
    skippedWeeks: parseSkippedWeeks(row.skippedWeeksJson),
  };
}

export async function saveWeekWrapSettings(
  poolId: string,
  settings: WeekWrapSettings
) {
  await ensureWeekWrapTable(prisma);
  const data = {
    tone: settings.tone,
    showRoster: settings.blocks.roster,
    showPicks: settings.blocks.picks,
    showBoardLink: settings.blocks.board,
    showDrama: settings.blocks.drama,
    emailOverride: settings.emailOverride,
    smsOverride: settings.smsOverride,
    skippedWeeksJson: JSON.stringify(settings.skippedWeeks),
  };
  await prisma.weekWrapSetting.upsert({
    where: { poolId },
    create: { poolId, ...data },
    update: data,
  });
}

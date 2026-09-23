import { WEEK_WRAP_BOARD_URL } from "./week-wrap-sections";
import {
  DEFAULT_WEEK_WRAP_SETTINGS,
  type WeekWrapPanelData,
} from "./week-wrap-types";

export function emptyWeekWrapPanel(): WeekWrapPanelData {
  return {
    boardUrl: WEEK_WRAP_BOARD_URL,
    selectedWeek: 1,
    tone: DEFAULT_WEEK_WRAP_SETTINGS.tone,
    blocks: { ...DEFAULT_WEEK_WRAP_SETTINGS.blocks },
    emailOverride: "",
    smsOverride: "",
    weeks: [],
    board: [],
    nfl: null,
    audience: { email: 0, sms: 0, skippedOff: 0, nicknames: [] },
  };
}

import { appOrigin } from "./add-user-prep";
import { loadRemindWeeks } from "./missing-pick-load";
import type { MissingPickPanelData } from "./missing-pick-who";

export async function listAdminMissingPicks(
  poolId: string,
  now: Date = new Date()
): Promise<MissingPickPanelData> {
  const weeks = await loadRemindWeeks({ poolId, now, mode: "admin" });
  return {
    pickUrl: `${appOrigin()}/pick`,
    weeks: weeks.map((week) => ({
      weekId: week.id,
      weekNumber: week.number,
      lockLabel: week.lockLabel,
      blanks: week.blanks.map((seat) => ({
        membershipId: seat.membershipId,
        nickname: seat.nickname,
      })),
    })),
  };
}

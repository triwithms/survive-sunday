import { appOrigin } from "./add-user-prep";
import { loadRemindWeeks } from "./missing-pick-load";
import { remindPlanFor } from "./missing-pick-plan";
import type { MissingPickPanelData } from "./missing-pick-who";

export async function listAdminMissingPicks(
  poolId: string,
  now: Date = new Date()
): Promise<MissingPickPanelData> {
  const weeks = await loadRemindWeeks({ poolId, now, mode: "admin" });
  const plans = await Promise.all(weeks.map((week) => remindPlanFor(week.blanks)));
  return {
    pickUrl: `${appOrigin()}/pick`,
    weeks: weeks.map((week, index) => ({
      weekId: week.id,
      weekNumber: week.number,
      lockLabel: week.lockLabel,
      plan: plans[index],
      blanks: week.blanks.map((seat) => ({
        membershipId: seat.membershipId,
        nickname: seat.nickname,
      })),
    })),
  };
}

import { prisma } from "./db";
import { prefsFromRow, channelsOf } from "./notify-pref-columns";
import {
  noticeCounts,
  type NoticeCounts,
  type NoticePerson,
} from "./notice-audience";
import type { RemindSeat } from "./missing-pick-who";

function personFrom(
  seat: RemindSeat,
  row?: { masterOn: boolean; channelsJson: string } | null
): NoticePerson {
  const prefs = prefsFromRow(row);
  return {
    userId: seat.userId,
    nickname: seat.nickname,
    email: seat.email,
    phoneE164: seat.phoneE164,
    notifyPref: seat.notifyPref,
    masterOn: prefs.masterOn,
    channels: channelsOf(prefs),
  };
}

/** Planned reminder counts. Does not send and does not create pref rows. */
export async function remindPlanFor(seats: RemindSeat[]): Promise<NoticeCounts> {
  const ids = [...new Set(seats.map((seat) => seat.userId))];
  try {
    const rows = ids.length
      ? await prisma.notificationPreference.findMany({
          where: { userId: { in: ids } },
          select: { userId: true, masterOn: true, channelsJson: true },
        })
      : [];
    const byId = new Map(rows.map((row) => [row.userId, row]));
    return noticeCounts(
      seats.map((seat) => personFrom(seat, byId.get(seat.userId))),
      "missingPickReminder"
    );
  } catch (error) {
    console.error("[missing-pick] plan skipped", error);
    return noticeCounts(
      seats.map((seat) => personFrom(seat, null)),
      "missingPickReminder"
    );
  }
}

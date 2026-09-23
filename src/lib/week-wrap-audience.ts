import { prisma } from "./db";
import { channelsOf, prefsFromRow } from "./notify-pref-columns";
import { EMPTY_NOTICE, noticeCounts, type NoticeCounts } from "./notice-audience";

/** Who would receive a week wrap, from notification prefs. No send. */
export async function loadWrapAudience(poolId: string): Promise<NoticeCounts> {
  try {
    const members = await prisma.membership.findMany({
      where: { poolId },
      select: {
        userId: true,
        nickname: true,
        user: {
          select: {
            email: true,
            phoneE164: true,
            notifyPref: true,
            notificationPreference: {
              select: { masterOn: true, channelsJson: true },
            },
          },
        },
      },
    });
    return noticeCounts(
      members.map((member) => {
        const prefs = prefsFromRow(member.user.notificationPreference);
        return {
          userId: member.userId,
          nickname: member.nickname,
          email: member.user.email,
          phoneE164: member.user.phoneE164,
          notifyPref: member.user.notifyPref,
          masterOn: prefs.masterOn,
          channels: channelsOf(prefs),
        };
      }),
      "weekWrap"
    );
  } catch (error) {
    console.error("[week-wrap] audience skipped", error);
    return EMPTY_NOTICE;
  }
}

import type { RemindSeat } from "./missing-pick-who";

export function toRemindSeat(member: {
  id: string;
  nickname: string;
  status: string;
  role: string;
  isParticipant: boolean;
  playingFromWeek: number | null;
  user: {
    id: string;
    email: string | null;
    phoneE164: string | null;
    notifyPref: string;
  };
}): RemindSeat {
  return {
    membershipId: member.id,
    nickname: member.nickname,
    status: member.status,
    role: member.role,
    isParticipant: member.isParticipant,
    playingFromWeek: member.playingFromWeek,
    userId: member.user.id,
    email: member.user.email,
    phoneE164: member.user.phoneE164,
    notifyPref: member.user.notifyPref,
  };
}

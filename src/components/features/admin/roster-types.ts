import type { MirrorOption } from "@/components/MirrorPicksForm";
import type { NotificationPrefs } from "@/lib/notification-types";

export type RosterMember = {
  id: string;
  userId: string;
  nickname: string;
  realName: string | null;
  status: string;
  role: string;
  email: string | null;
  phoneE164: string | null;
  notifyPref: string | null;
  notifyPrefs?: NotificationPrefs;
  mirrorFromMembershipId: string | null;
  pickBackup: string | null;
};

export type RosterMirrorOption = MirrorOption;

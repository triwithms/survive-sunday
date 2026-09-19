import type { MirrorOption } from "@/components/MirrorPicksForm";

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
  mirrorFromMembershipId: string | null;
  pickBackup: string | null;
};

export type RosterMirrorOption = MirrorOption;

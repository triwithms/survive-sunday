import type { MissingPickPanelData } from "@/lib/missing-pick-who";
import type { NoticeCounts } from "@/lib/notice-audience";
import type { WeekWrapPanelData } from "@/lib/week-wrap-types";
import type { EnterPickData } from "./enter-pick-types";
import type { AdminRoleRow } from "./admin-role-types";
import type { RosterMember } from "./roster-types";
import type { SetPasswordMember } from "./password-members";

export type MemberRow = {
  id: string;
  userId: string;
  nickname: string;
  realName: string | null;
  status: string;
  role: string;
  isParticipant?: boolean;
  pickBackup: string | null;
  mirrorFromMembershipId: string | null;
  paymentStatus?: string;
  paymentNote?: string | null;
  paymentMarkedAt?: Date | null;
  user: {
    email: string | null;
    phoneE164: string | null;
    notifyPref?: string | null;
    notificationPreference?: {
      masterOn: boolean;
      channelsJson: string;
      pushEnabled: boolean;
    } | null;
  };
};

export type RemoveMember = {
  id: string;
  nickname: string;
  realName: string | null;
  status: string;
  role: string;
};

export type UsersScreenProps = {
  passwordMembers: SetPasswordMember[];
  roleMembers: AdminRoleRow[];
  canDemoteMembershipIds: string[];
  rosterMembers: RosterMember[];
  removeMembers: RemoveMember[];
  enterPick: EnterPickData;
  paymentTrackingEnabled: boolean;
  entryFeeCents: number | null;
  entryFeeCurrency: string;
};

export type ConfigScreenProps = {
  poolId: string;
  poolName: string;
  currentWeek: number;
  startWeek: number | null;
  singleEliminationFromWeek: number | null;
  oneLossCount: number;
  undefeatedCount: number;
  transferMembers: { id: string; nickname: string; status: string }[];
  roleMembers: AdminRoleRow[];
  canDemoteMembershipIds: string[];
  poolInviteActive: boolean;
  paymentTrackingEnabled: boolean;
  entryFeeCents: number | null;
  entryFeeCurrency: string;
  paymentInstructions: string | null;
  paymentLink: string | null;
  /** Stored pool switch (null = on). The env override is separate. */
  showTeamLogos: boolean;
  teamLogosForcedOff: boolean;
};

export type AuditLogRow = {
  id: string;
  action: string;
  createdAt: string;
  details: string | null;
};

export type ServerErrorItem = {
  id: string;
  route: string;
  message: string;
  createdAt: string;
  source: string;
};

export type SystemScreenProps = {
  weekNumber: number;
  enterPick: EnterPickData;
  missingPicks: MissingPickPanelData;
  weekWrap: WeekWrapPanelData;
  logs: AuditLogRow[];
  serverErrors: ServerErrorItem[];
  unpaidFees: { count: number; plan: NoticeCounts } | null;
};

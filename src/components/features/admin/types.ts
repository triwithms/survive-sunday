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
  user: { email: string | null; phoneE164: string | null };
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
};

export type ConfigScreenProps = {
  currentWeek: number;
  singleEliminationFromWeek: number | null;
  oneLossCount: number;
  undefeatedCount: number;
  transferMembers: { id: string; nickname: string; status: string }[];
  roleMembers: AdminRoleRow[];
  canDemoteMembershipIds: string[];
};

export type AuditLogRow = {
  id: string;
  action: string;
  createdAt: string;
  details: string | null;
};

export type SystemScreenProps = {
  weekNumber: number;
  enterPick: EnterPickData;
  logs: AuditLogRow[];
};

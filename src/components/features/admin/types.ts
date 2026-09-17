import type { AdminRoleRow } from "@/components/AdminRolesPanel";
import type { RosterMember, RosterMirrorOption } from "@/components/RosterEditor";
import type { SetPasswordMember } from "@/components/SetMemberPasswordForm";
import type { ClaimableSeat } from "@/lib/claim-seat";
import type { EmailDeliveryStatus } from "@/lib/delivery";

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
  user: { email: string };
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
  mirrorOptions: RosterMirrorOption[];
  removeMembers: RemoveMember[];
};

export type ConfigScreenProps = {
  initialMode: "demo" | "live";
  isPracticeLogin: boolean;
  currentEmail: string | null;
  currentWeek: number;
  singleEliminationFromWeek: number | null;
  oneLossCount: number;
  undefeatedCount: number;
  transferMembers: { id: string; nickname: string; status: string }[];
  weekNumber: number;
  games: { id: string; label: string; status: string }[];
};

export type CommsScreenProps = { seats: ClaimableSeat[] };

export type AuditLogRow = {
  id: string;
  action: string;
  createdAt: string;
  details: string | null;
};

export type SystemScreenProps = {
  delivery: EmailDeliveryStatus;
  logs: AuditLogRow[];
};

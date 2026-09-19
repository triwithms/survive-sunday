import type { RoleView } from "@/lib/roles";

export type AccountScreenProps = {
  nickname: string;
  statusLabel: string;
  canSwitchRoles: boolean;
  roleView: RoleView;
  showAdmin: boolean;
  showPickBackup: boolean;
  phoneE164: string | null;
};

export type AccountMirrorProps = {
  membershipId: string;
  initialMode: import("@/lib/pick-mirror").PickBackupMode;
  initialSourceId: string | null;
  options: { id: string; nickname: string; label: string }[];
};

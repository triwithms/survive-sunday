import type { RoleView } from "@/lib/roles";
import type { PickBackupMode } from "@/lib/pick-mirror";

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
  initialMode: PickBackupMode;
};

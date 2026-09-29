import type { PoolChoice } from "@/lib/active-pool";
import type { PlayerEntryFee } from "@/lib/payment-tracking";
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
  pools: PoolChoice[];
  activePoolId: string | null;
  entryFee: PlayerEntryFee | null;
  poolStartWeek: number | null;
  startWeeks: number[];
  defaultStartWeek: number | null;
};

export type AccountMirrorProps = {
  membershipId: string;
  initialMode: PickBackupMode;
};

import { AdminDetails } from "./AdminDetails";
import { AdminRolesPanel } from "./AdminRolesPanel";
import { AdminHeading } from "./AdminHeading";
import { PoolRulesForm } from "./PoolRulesForm";
import { ResetPoolPanel } from "./ResetPoolPanel";
import { TransferCommissionerForm } from "./TransferCommissionerForm";
import type { ConfigScreenProps } from "./types";

export function ConfigScreen(props: ConfigScreenProps) {
  return (
    <div className="space-y-4">
      <AdminHeading title="Pool">
        Mulligan rules and Hand the pool. Administrators are listed here.
        Reset is last.
      </AdminHeading>
      <PoolRulesForm
        currentWeek={props.currentWeek}
        singleEliminationFromWeek={props.singleEliminationFromWeek}
        oneLossCount={props.oneLossCount}
        undefeatedCount={props.undefeatedCount}
      />
      <AdminRolesPanel members={props.roleMembers} />
      <TransferCommissionerForm members={props.transferMembers} />
      <AdminDetails title="Danger — reset the pool" danger testId="pool-danger">
        <ResetPoolPanel />
      </AdminDetails>
    </div>
  );
}

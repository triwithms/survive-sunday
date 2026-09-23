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
        Mulligan rules, Make administrator, and Hand the pool. Reset is last.
      </AdminHeading>
      <PoolRulesForm
        currentWeek={props.currentWeek}
        singleEliminationFromWeek={props.singleEliminationFromWeek}
        oneLossCount={props.oneLossCount}
        undefeatedCount={props.undefeatedCount}
      />
      <AdminRolesPanel
        members={props.roleMembers}
        canDemoteMembershipIds={props.canDemoteMembershipIds}
      />
      <TransferCommissionerForm members={props.transferMembers} />
      <AdminDetails title="Danger — reset the pool" danger testId="pool-danger">
        <ResetPoolPanel />
      </AdminDetails>
    </div>
  );
}

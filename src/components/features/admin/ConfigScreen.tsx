import { PoolRulesForm } from "./PoolRulesForm";
import { TransferCommissionerForm } from "./TransferCommissionerForm";
import { AdminHeading } from "./AdminHeading";
import type { ConfigScreenProps } from "./types";

export function ConfigScreen(props: ConfigScreenProps) {
  return (
    <div className="space-y-6">
      <AdminHeading title="Pool Config">
        Mulligan / one-and-done week, and handing the pool to someone else.
      </AdminHeading>
      <PoolRulesForm
        currentWeek={props.currentWeek}
        singleEliminationFromWeek={props.singleEliminationFromWeek}
        oneLossCount={props.oneLossCount}
        undefeatedCount={props.undefeatedCount}
      />
      <TransferCommissionerForm members={props.transferMembers} />
    </div>
  );
}

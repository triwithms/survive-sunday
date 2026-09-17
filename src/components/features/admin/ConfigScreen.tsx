import { PoolModePanel } from "./PoolModePanel";
import { PoolRulesForm } from "./PoolRulesForm";
import { TransferCommissionerForm } from "./TransferCommissionerForm";
import { AdminHeading } from "./AdminHeading";
import type { ConfigScreenProps } from "./types";

export function ConfigScreen(props: ConfigScreenProps) {
  return (
    <div className="space-y-6">
      <AdminHeading title="Pool Config">
        Real vs demo mode, the mulligan rule, and handing the pool to someone
        else.
      </AdminHeading>
      <PoolModePanel
        initialMode={props.initialMode}
        isPracticeLogin={props.isPracticeLogin}
      />
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

import Link from "next/link";
import { CommissionerAccountPanel } from "@/components/CommissionerAccountPanel";
import { PoolModePanel } from "@/components/PoolModePanel";
import { PoolRulesForm } from "@/components/PoolRulesForm";
import { TransferCommissionerForm } from "@/components/TransferCommissionerForm";
import { AdminGradePanel } from "./AdminGradePanel";
import { AdminHeading } from "./AdminHeading";
import { AdminLockPanel } from "./AdminLockPanel";
import type { ConfigScreenProps } from "./types";

export function ConfigScreen(props: ConfigScreenProps) {
  return (
    <div className="space-y-6">
      <AdminHeading title="Pool Config">
        Real vs demo mode, mulligan, week lock and grading, and who runs the
        pool.
      </AdminHeading>
      <PoolModePanel
        initialMode={props.initialMode}
        isPracticeLogin={props.isPracticeLogin}
      />
      <CommissionerAccountPanel
        currentEmail={props.currentEmail}
        isPracticeLogin={props.isPracticeLogin}
      />
      <PoolRulesForm
        currentWeek={props.currentWeek}
        singleEliminationFromWeek={props.singleEliminationFromWeek}
        oneLossCount={props.oneLossCount}
        undefeatedCount={props.undefeatedCount}
      />
      <TransferCommissionerForm members={props.transferMembers} />
      <AdminLockPanel weekNumber={props.weekNumber} />
      <AdminGradePanel weekNumber={props.weekNumber} games={props.games} />
      <Link
        href="/admin/import"
        prefetch={false}
        className="btn-secondary inline-flex items-center justify-center w-full min-h-11"
      >
        Import week picks (CSV / paste)
      </Link>
    </div>
  );
}

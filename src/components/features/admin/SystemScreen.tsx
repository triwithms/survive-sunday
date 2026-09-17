import Link from "next/link";
import { AdminGradePanel } from "./AdminGradePanel";
import { AdminHeading } from "./AdminHeading";
import { AdminLockPanel } from "./AdminLockPanel";
import { AuditLogList } from "./AuditLogList";
import { CommissionerAccountPanel } from "./CommissionerAccountPanel";
import { CommissionerSignOut } from "./CommissionerSignOut";
import { OpsPointers } from "./OpsPointers";
import { EnterPickForm } from "./EnterPickForm";
import { PickCensusPanel } from "./PickCensusPanel";
import { ResetPoolPanel } from "./ResetPoolPanel";
import type { SystemScreenProps } from "./types";

export function SystemScreen(props: SystemScreenProps) {
  return (
    <div className="space-y-6">
      <AdminHeading title="System">
        Who still needs a pick this week, enter a friend’s pick, then login,
        reset, lock, import, and the audit log.
      </AdminHeading>
      <PickCensusPanel census={props.census} />
      <EnterPickForm data={props.enterPick} />
      <CommissionerSignOut />
      <CommissionerAccountPanel
        currentEmail={props.currentEmail}
        isPracticeLogin={props.isPracticeLogin}
      />
      <ResetPoolPanel />
      <AdminLockPanel weekNumber={props.weekNumber} />
      <AdminGradePanel weekNumber={props.weekNumber} games={props.games} />
      <Link
        href="/admin/import"
        prefetch={false}
        className="btn-secondary inline-flex items-center justify-center w-full min-h-11"
      >
        Import week picks (CSV / paste)
      </Link>
      <AuditLogList logs={props.logs} />
      <OpsPointers />
    </div>
  );
}

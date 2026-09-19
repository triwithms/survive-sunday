import { AdminDetails } from "./AdminDetails";
import { AdminHeading } from "./AdminHeading";
import { AuditLogList } from "./AuditLogList";
import { CommissionerAccountPanel } from "./CommissionerAccountPanel";
import { EnterPickForm } from "./EnterPickForm";
import { PickCensusPanel } from "./PickCensusPanel";
import { ResetPoolPanel } from "./ResetPoolPanel";
import { SystemWeekTools } from "./SystemWeekTools";
import type { SystemScreenProps } from "./types";

export function SystemScreen(props: SystemScreenProps) {
  return (
    <div className="space-y-4">
      <AdminHeading title="System">
        Who still needs a pick, then enter one. Reset stays closed.
      </AdminHeading>
      <PickCensusPanel census={props.census} />
      <EnterPickForm data={props.enterPick} />
      <SystemWeekTools weekNumber={props.weekNumber} games={props.games} />
      <AdminDetails title="Your administrator login" testId="system-login">
        <CommissionerAccountPanel
          currentEmail={props.currentEmail}
          isPracticeLogin={props.isPracticeLogin}
        />
      </AdminDetails>
      <AdminDetails title="Danger — reset the pool" danger testId="system-danger">
        <ResetPoolPanel />
      </AdminDetails>
      <AuditLogList logs={props.logs} />
    </div>
  );
}

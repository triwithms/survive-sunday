import { AdminHeading } from "./AdminHeading";
import { AuditLogList } from "./AuditLogList";
import { EnterPickForm } from "./EnterPickForm";
import { MissingPickPanel } from "./MissingPickPanel";
import { SendTestNotify } from "./SendTestNotify";
import { ServerErrorList } from "./ServerErrorList";
import { UnpaidFeesPanel } from "./UnpaidFeesPanel";
import { WeekWrapPanel } from "./WeekWrapPanel";
import type { SystemScreenProps } from "./types";

export function SystemScreen(props: SystemScreenProps) {
  return (
    <div className="space-y-4">
      <AdminHeading title="This Week">
        Week wrap is first. Then missing picks, unpaid entry fees when you
        track them, enter a friend’s pick, and a test notice. Reset lives on
        Pool.
      </AdminHeading>
      <WeekWrapPanel data={props.weekWrap} />
      <MissingPickPanel data={props.missingPicks} />
      {props.unpaidFees ? (
        <UnpaidFeesPanel count={props.unpaidFees.count} plan={props.unpaidFees.plan} />
      ) : null}
      <EnterPickForm data={props.enterPick} />
      <SendTestNotify />
      <AuditLogList logs={props.logs} />
      <ServerErrorList rows={props.serverErrors} />
    </div>
  );
}

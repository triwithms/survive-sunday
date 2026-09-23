import { AdminDetails } from "./AdminDetails";
import { AdminHeading } from "./AdminHeading";
import { AuditLogList } from "./AuditLogList";
import { EnterPickForm } from "./EnterPickForm";
import { ResetPoolPanel } from "./ResetPoolPanel";
import { SendTestNotify } from "./SendTestNotify";
import { WeekWrapPanel } from "./WeekWrapPanel";
import type { SystemScreenProps } from "./types";

export function SystemScreen(props: SystemScreenProps) {
  return (
    <div className="space-y-4">
      <AdminHeading title="System">
        Enter a friend’s pick for this week or a past week. Next week opens
        for them after their own game starts. Week wrap sends at noon
        the day after the last game is final. Reset stays closed.
      </AdminHeading>
      <EnterPickForm data={props.enterPick} />
      <WeekWrapPanel data={props.weekWrap} />
      <SendTestNotify />
      <AdminDetails title="Danger — reset the pool" danger testId="system-danger">
        <ResetPoolPanel />
      </AdminDetails>
      <AuditLogList logs={props.logs} />
    </div>
  );
}

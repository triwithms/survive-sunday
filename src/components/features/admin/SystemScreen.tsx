import { AdminHeading } from "./AdminHeading";
import { AuditLogList } from "./AuditLogList";
import { EnterPickForm } from "./EnterPickForm";
import { MissingPickPanel } from "./MissingPickPanel";
import { SendTestNotify } from "./SendTestNotify";
import { WeekWrapPanel } from "./WeekWrapPanel";
import type { SystemScreenProps } from "./types";

export function SystemScreen(props: SystemScreenProps) {
  return (
    <div className="space-y-4">
      <AdminHeading title="This Week">
        Week wrap is first. Then missing picks, enter a friend’s pick, and a
        test notice. Reset lives on Pool.
      </AdminHeading>
      <WeekWrapPanel data={props.weekWrap} />
      <MissingPickPanel data={props.missingPicks} />
      <EnterPickForm data={props.enterPick} />
      <SendTestNotify />
      <AuditLogList logs={props.logs} />
    </div>
  );
}

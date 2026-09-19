import { AccountInstallLink } from "./AccountInstallLink";
import { AccountRow } from "./AccountRow";
import { FEEDBACK_PATH } from "./account-row";

export function AccountHubLinks({
  showAdmin,
  showPickBackup,
}: {
  showAdmin: boolean;
  showPickBackup: boolean;
}) {
  return (
    <div className="space-y-2">
      <AccountRow href="/account/notifications" testId="notification-prefs">
        Notification preferences
      </AccountRow>
      {showPickBackup ? (
        <AccountRow href="/account/mirror" testId="pick-backup">
          Pick backup
        </AccountRow>
      ) : null}
      {showAdmin ? <AccountRow href="/admin">Admin</AccountRow> : null}
      <AccountInstallLink />
      <AccountRow href="/help">Help</AccountRow>
      <AccountRow href={FEEDBACK_PATH} testId="account-feedback">
        Report a bug or idea
      </AccountRow>
    </div>
  );
}

import { RoleSwitcher } from "@/components/RoleSwitcher";
import { SignOutButton } from "@/components/SignOutButton";
import { Card } from "@/components/ui";
import { AccountHubLinks } from "./AccountHubLinks";
import { AccountNicknameSheet } from "./AccountNicknameSheet";
import { AccountPhoneRow } from "./AccountPhoneRow";
import type { AccountScreenProps } from "./types";

export function AccountScreen(p: AccountScreenProps) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl text-gold-400 tracking-wide">
          Settings
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          Small account tools live here so the six tabs stay clear.
        </p>
      </div>
      <Card className="space-y-3 p-4">
        <div>
          <p
            className="text-lg font-medium text-[var(--text-primary)] break-words"
            data-testid="session-nickname"
          >
            {p.nickname}
          </p>
          <p className="text-sm text-[var(--text-muted)] capitalize mt-0.5">
            {p.statusLabel}
          </p>
        </div>
        {p.canSwitchRoles ? (
          <RoleSwitcher playerName={p.nickname} activeView={p.roleView} />
        ) : null}
      </Card>
      <div className="space-y-2">
        <AccountNicknameSheet nickname={p.nickname} />
        <AccountPhoneRow phoneE164={p.phoneE164} />
        <AccountHubLinks
          showAdmin={p.showAdmin}
          showPickBackup={p.showPickBackup}
        />
        <SignOutButton next="/login" className="btn-danger w-full" />
      </div>
    </div>
  );
}

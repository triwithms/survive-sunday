"use client";

import { Button } from "@/components/ui";
import { ModalDialog } from "@/components/ModalDialog";
import type { RoleConfirm } from "./admin-role-types";

export function AdminRoleConfirm({
  confirm,
  titleId,
  busy,
  onCancel,
  onRun,
}: {
  confirm: RoleConfirm;
  titleId: string;
  busy: boolean;
  onCancel: () => void;
  onRun: () => void;
}) {
  const promote = confirm.action === "promote";
  return (
    <ModalDialog labelledBy={titleId} onBackdropClick={busy ? undefined : onCancel}>
      <h2 id={titleId} className="font-semibold text-lg text-gold-400">
        {promote
          ? `Give ${confirm.nickname} Admin tools?`
          : `Remove Admin from ${confirm.nickname}?`}
      </h2>
      <p className="text-sm text-[var(--text-muted)]">
        {promote
          ? "They can change pool settings, import picks, and open Admin. They stay on the board as a player."
          : "They stay in the pool as a player. They will no longer see Admin tools."}
      </p>
      <div className="flex gap-2 pt-2">
        <Button variant="secondary" className="flex-1" disabled={busy} onClick={onCancel}>
          Cancel
        </Button>
        <Button className="flex-1" disabled={busy} onClick={onRun}>
          {busy ? "Saving…" : "Yes, confirm"}
        </Button>
      </div>
    </ModalDialog>
  );
}

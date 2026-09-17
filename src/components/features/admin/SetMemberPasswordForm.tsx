"use client";

import { Card } from "@/components/ui";
import type { SetPasswordMember } from "./password-members";
import { postTempPassword, usePasswordForm } from "./use-password-form";
import { SetPasswordFields } from "./SetPasswordFields";
import { SetPasswordSaved } from "./SetPasswordSaved";

export type { SetPasswordMember } from "./password-members";

export function SetMemberPasswordForm({ members }: { members: SetPasswordMember[] }) {
  const f = usePasswordForm(members);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    f.setErr("");
    f.setSaved(null);
    if (!f.selected?.claimed) {
      f.setErr(
        f.selected
          ? `${f.selected.nickname} has not Joined yet. Send them their personal Join link instead of a password.`
          : "Pick someone who has already Joined."
      );
      return;
    }
    if (f.password !== f.confirm) {
      f.setErr("Those passwords don’t match.");
      return;
    }
    f.setBusy(true);
    const data = await postTempPassword(f.selected.id, f.confirmNickname.trim(), f.password);
    f.setBusy(false);
    if (!data.ok) {
      f.setErr(data.error);
      return;
    }
    f.setSaved({
      nickname: data.nickname || f.selected.nickname,
      emailMasked: data.emailMasked || f.selected.emailMasked || "",
      password: f.password,
    });
    f.setConfirmNickname("");
  }

  if (!members.length) {
    return (
      <Card as="section" className="p-4 space-y-2">
        <h2 className="font-semibold">Set a temporary password</h2>
        <p className="text-sm text-[var(--text-muted)]">There are no player seats yet.</p>
      </Card>
    );
  }

  return (
    <Card as="section" className="p-4 space-y-3">
      <div>
        <h2 className="font-semibold">Set a temporary password</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          For a friend who already Joined but cannot get a code. You text the
          password. We do not email it.
        </p>
      </div>
      {!f.claimed.length ? (
        <p className="text-sm text-crimson-400" role="status">
          Nobody has Joined with a real email yet. Send a personal Join link instead.
        </p>
      ) : f.saved ? (
        <SetPasswordSaved
          {...f.saved}
          onCopy={() => { void navigator.clipboard.writeText(f.saved!.password).catch(() => {}); }}
          onAnother={() => { f.setSaved(null); f.setPassword(""); f.setConfirm(""); }}
        />
      ) : (
        <SetPasswordFields
          claimed={f.claimed}
          unclaimed={f.unclaimed}
          selected={f.selected}
          membershipId={f.membershipId}
          confirmNickname={f.confirmNickname}
          password={f.password}
          confirm={f.confirm}
          busy={f.busy}
          err={f.err}
          onMembership={(id) => { f.setMembershipId(id); f.setConfirmNickname(""); f.setSaved(null); }}
          onConfirmNickname={f.setConfirmNickname}
          onPassword={f.setPassword}
          onConfirm={f.setConfirm}
          onSubmit={(e) => void save(e)}
        />
      )}
    </Card>
  );
}

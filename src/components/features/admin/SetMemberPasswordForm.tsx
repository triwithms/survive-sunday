"use client";

import { Card } from "@/components/ui";
import type { SetPasswordMember } from "./password-members";
import { usePasswordForm } from "./use-password-form";
import { SetPasswordFields } from "./SetPasswordFields";
import { SetPasswordSaved } from "./SetPasswordSaved";

export type { SetPasswordMember } from "./password-members";

export function SetMemberPasswordForm({
  members,
  embedded,
}: {
  members: SetPasswordMember[];
  embedded?: boolean;
}) {
  const f = usePasswordForm(members, embedded);
  const heading = (
    <div>
      <h2 className="font-semibold">Set a password</h2>
      <p className="text-sm text-[var(--text-muted)] mt-1">
        Suggest one, save, then copy the text and send it. We do not email it.
      </p>
    </div>
  );

  let body: React.ReactNode;
  if (!members.length) {
    body = (
      <p className="text-sm text-[var(--text-muted)]">There are no player seats yet.</p>
    );
  } else if (!f.claimed.length) {
    body = (
      <p className="text-sm text-crimson-400" role="status">
        Nobody has Joined with a real email yet. Send a personal Join link instead.
      </p>
    );
  } else if (f.saved) {
    body = (
      <SetPasswordSaved
        {...f.saved}
        onAnother={() => {
          f.setSaved(null);
          f.setPassword("");
          f.setConfirm("");
          f.setConfirmNickname(f.selected?.nickname ?? "");
        }}
      />
    );
  } else {
    body = (
      <SetPasswordFields
        claimed={f.claimed}
        unclaimed={embedded ? [] : f.unclaimed}
        selected={f.selected}
        membershipId={f.membershipId}
        confirmNickname={f.confirmNickname}
        password={f.password}
        confirm={f.confirm}
        kind={f.kind}
        busy={f.busy}
        err={f.err}
        lockMember={embedded}
        onMembership={(id) => {
          f.setMembershipId(id);
          f.setConfirmNickname(
            members.find((m) => m.id === id)?.nickname ?? ""
          );
          f.setSaved(null);
        }}
        onConfirmNickname={f.setConfirmNickname}
        onPassword={f.setPassword}
        onConfirm={f.setConfirm}
        onKind={f.setKind}
        onSubmit={(e) => void f.submit(e)}
      />
    );
  }

  if (embedded) {
    return <section className="space-y-3 min-w-0">{heading}{body}</section>;
  }
  return (
    <Card as="section" className="p-4 space-y-3">
      {heading}
      {body}
    </Card>
  );
}

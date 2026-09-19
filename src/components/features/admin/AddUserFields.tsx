"use client";

import { Button } from "@/components/ui";
import { RosterCardFields } from "./RosterCardFields";
import { RosterContactFields } from "./RosterContactFields";
import { RosterNotifySoon } from "./RosterNotifySoon";
import { SetPasswordKind } from "./SetPasswordKind";
import type { AddUserDraft } from "./add-user-types";

type Props = {
  draft: AddUserDraft;
  busy: boolean;
  err: string;
  onChange: (patch: Partial<AddUserDraft>) => void;
  onSuggest: () => void;
  onSubmit: (e: React.FormEvent) => void;
};

export function AddUserFields({ draft, busy, err, onChange, onSuggest, onSubmit }: Props) {
  return (
    <form onSubmit={onSubmit} className="space-y-3" data-testid="add-user-form">
      <RosterCardFields
        nickname={draft.nickname}
        realName={draft.realName}
        disabled={busy}
        onNickname={(nickname) => onChange({ nickname })}
        onRealName={(realName) => onChange({ realName })}
      />
      <RosterContactFields
        email={draft.email}
        phone={draft.phone}
        disabled={busy}
        onEmail={(email) => onChange({ email })}
        onPhone={(phone) => onChange({ phone })}
      />
      <SetPasswordKind
        kind={draft.kind}
        onKind={(kind) => onChange({ kind })}
      />
      <label className="block text-sm">
        <span className="text-[var(--text-muted)]">Password (optional)</span>
        <input
          type="text"
          value={draft.password}
          onChange={(e) => onChange({ password: e.target.value })}
          minLength={6}
          maxLength={72}
          autoComplete="off"
          className="mt-1 font-mono"
          data-testid="add-user-password"
        />
      </label>
      <label className="block text-sm">
        <span className="text-[var(--text-muted)]">Type it again</span>
        <input
          type="text"
          value={draft.confirm}
          onChange={(e) => onChange({ confirm: e.target.value })}
          minLength={6}
          maxLength={72}
          autoComplete="off"
          className="mt-1 font-mono"
        />
      </label>
      <Button type="button" variant="secondary" className="w-full min-h-11" onClick={onSuggest}>
        Suggest a password I can text
      </Button>
      <label className="flex min-h-11 items-start gap-3 text-sm">
        <input
          type="checkbox"
          className="mt-1 !h-4 !w-4 !min-h-0 !p-0 shrink-0"
          checked={draft.invite}
          onChange={(e) => onChange({ invite: e.target.checked })}
          data-testid="add-user-invite"
        />
        <span className="min-w-0 flex-1 whitespace-normal break-words leading-snug">
          Also make a Join invite I can send. They can finish missing details on Welcome.
        </span>
      </label>
      <RosterNotifySoon />
      {err ? <p className="text-sm text-crimson-400" role="alert">{err}</p> : null}
      <Button type="submit" className="w-full min-h-11" disabled={busy} data-testid="add-user-submit">
        {busy ? "Adding…" : "Add user"}
      </Button>
    </form>
  );
}

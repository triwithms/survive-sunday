"use client";

import { Button } from "@/components/ui";
import {
  passwordMemberLabel,
  suggestTempPassword,
  type SetPasswordMember,
} from "./password-members";

type Props = {
  claimed: SetPasswordMember[];
  unclaimed: SetPasswordMember[];
  selected?: SetPasswordMember;
  membershipId: string;
  confirmNickname: string;
  password: string;
  confirm: string;
  busy: boolean;
  err: string;
  onMembership: (id: string) => void;
  onConfirmNickname: (value: string) => void;
  onPassword: (value: string) => void;
  onConfirm: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
};

export function SetPasswordFields(p: Props) {
  return (
    <form onSubmit={p.onSubmit} className="space-y-3">
      <label className="block text-sm space-y-1">
        <span className="text-[var(--text-muted)]">Friend who Joined</span>
        <select
          className="w-full min-h-11 rounded-md bg-stadium-800 border border-stadium-border px-3"
          value={p.membershipId}
          onChange={(e) => p.onMembership(e.target.value)}
        >
          {p.claimed.map((m) => (
            <option key={m.id} value={m.id}>{passwordMemberLabel(m)}</option>
          ))}
        </select>
      </label>
      {p.unclaimed.length > 0 ? (
        <p className="text-xs text-[var(--text-muted)]">
          Not Joined yet: {p.unclaimed.map((m) => m.nickname).join(", ")}.
        </p>
      ) : null}
      <label className="block text-sm space-y-1">
        <span className="text-[var(--text-muted)]">
          Type {p.selected?.nickname ?? "their nickname"} to confirm
        </span>
        <input
          type="text"
          autoComplete="off"
          className="w-full min-h-11 rounded-md bg-stadium-800 border border-stadium-border px-3"
          value={p.confirmNickname}
          onChange={(e) => p.onConfirmNickname(e.target.value)}
          placeholder={p.selected?.nickname ?? "Nickname"}
        />
      </label>
      <label className="block text-sm">
        <span className="text-[var(--text-muted)]">Temporary password</span>
        <input
          type="text" required minLength={6} maxLength={72}
          value={p.password} onChange={(e) => p.onPassword(e.target.value)}
          autoComplete="off" className="mt-1 font-mono"
        />
      </label>
      <label className="block text-sm">
        <span className="text-[var(--text-muted)]">Type it again</span>
        <input
          type="text" required minLength={6} maxLength={72}
          value={p.confirm} onChange={(e) => p.onConfirm(e.target.value)}
          autoComplete="off" className="mt-1 font-mono"
        />
      </label>
      <Button variant="secondary" className="w-full" onClick={() => {
        const next = suggestTempPassword();
        p.onPassword(next);
        p.onConfirm(next);
      }}>
        Suggest a password I can text
      </Button>
      {p.err ? <p className="text-sm text-crimson-400" role="alert">{p.err}</p> : null}
      <Button type="submit" className="w-full" disabled={p.busy}>
        {p.busy ? "Saving…" : "Save temporary password"}
      </Button>
    </form>
  );
}

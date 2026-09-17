<<<<<<< HEAD
"use client";

import { useMemo, useState } from "react";

export type SetPasswordMember = {
  id: string;
  nickname: string;
  realName: string | null;
  claimed: boolean;
  emailMasked: string | null;
};

function suggestTempPassword(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const n = ((bytes[0]! << 8) + bytes[1]!) % 9000 + 1000;
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const a = letters[bytes[2]! % letters.length];
  const b = letters[bytes[3]! % letters.length];
  return `Sunday-${n}${a}${b}`;
}

function label(m: SetPasswordMember): string {
  const real = (m.realName ?? "").trim();
  const who = real && real.toLowerCase() !== m.nickname.toLowerCase()
    ? `${m.nickname} (${real})`
    : m.nickname;
  return m.claimed
    ? `${who} — Joined ${m.emailMasked ?? ""}`
    : `${who} — not Joined yet`;
}

export function SetMemberPasswordForm({
  members,
}: {
  members: SetPasswordMember[];
}) {
  const claimed = useMemo(
    () => members.filter((m) => m.claimed),
    [members]
  );
  const unclaimed = useMemo(
    () => members.filter((m) => !m.claimed),
    [members]
  );
  const [membershipId, setMembershipId] = useState(claimed[0]?.id ?? "");
  const [confirmNickname, setConfirmNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState<{
    nickname: string;
    emailMasked: string;
    password: string;
  } | null>(null);

  const selected = members.find((m) => m.id === membershipId);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setSaved(null);
    if (!selected?.claimed) {
      setErr(
        selected
          ? `${selected.nickname} has not Joined yet. Send them their personal Join link instead of a password.`
          : "Pick someone who has already Joined."
      );
      return;
    }
    if (password !== confirm) {
      setErr("Those passwords don’t match.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membershipId: selected.id,
          confirmNickname: confirmNickname.trim(),
          password,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        nickname?: string;
        emailMasked?: string;
      };
      if (!res.ok) {
        setErr(data.error || "Could not save that password.");
        return;
      }
      setSaved({
        nickname: data.nickname || selected.nickname,
        emailMasked: data.emailMasked || selected.emailMasked || "",
        password,
      });
      setConfirmNickname("");
    } catch {
      setErr("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  function copyPassword() {
    if (!saved) return;
    void navigator.clipboard.writeText(saved.password).catch(() => {});
  }

  if (!members.length) {
    return (
      <section className="card-glass p-4 space-y-2">
        <h2 className="font-semibold">Set a temporary password</h2>
        <p className="text-sm text-[var(--text-muted)]">
          There are no player seats yet.
        </p>
      </section>
    );
  }

  return (
    <section className="card-glass p-4 space-y-3">
      <div>
        <h2 className="font-semibold">Set a temporary password</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Use this when a friend already Joined but cannot get a reset code.
          You text them the password. We do <strong>not</strong> email it
          (that is the broken path). This is written to the database and the
          audit log — the password itself is never stored in the log.
        </p>
      </div>

      {!claimed.length ? (
        <p className="text-sm text-crimson-400" role="status">
          Nobody has Joined with a real email yet. Send a personal Join link
          instead. Example: Cannoli Stuffer (Mike Frigo) must Join before you
          can set a password.
        </p>
      ) : saved ? (
        <div className="space-y-3">
          <p className="text-sm text-field-400" role="status">
            Saved for <strong>{saved.nickname}</strong> ({saved.emailMasked}).
            Text them this password, then they open Sign in. They can change
            it later with Forgot password once email works.
          </p>
          <p className="font-mono text-lg text-gold-400 break-all card-glass p-3">
            {saved.password}
          </p>
          <button
            type="button"
            className="btn-secondary w-full"
            onClick={copyPassword}
          >
            Copy password
          </button>
          <button
            type="button"
            className="btn-primary w-full"
            onClick={() => {
              setSaved(null);
              setPassword("");
              setConfirm("");
            }}
          >
            Set another
          </button>
        </div>
      ) : (
        <form onSubmit={save} className="space-y-3">
          <label className="block text-sm space-y-1">
            <span className="text-[var(--text-muted)]">Friend who Joined</span>
            <select
              className="w-full min-h-11 rounded-md bg-stadium-800 border border-stadium-border px-3"
              value={membershipId}
              onChange={(e) => {
                setMembershipId(e.target.value);
                setConfirmNickname("");
                setSaved(null);
              }}
            >
              {claimed.map((m) => (
                <option key={m.id} value={m.id}>
                  {label(m)}
                </option>
              ))}
            </select>
          </label>
          {unclaimed.length > 0 && (
            <p className="text-xs text-[var(--text-muted)]">
              Not Joined yet (send a Join link, do not set a password):{" "}
              {unclaimed.map((m) => m.nickname).join(", ")}.
            </p>
          )}
          <label className="block text-sm space-y-1">
            <span className="text-[var(--text-muted)]">
              Type {selected?.nickname ?? "their nickname"} to confirm
            </span>
            <input
              type="text"
              autoComplete="off"
              className="w-full min-h-11 rounded-md bg-stadium-800 border border-stadium-border px-3"
              value={confirmNickname}
              onChange={(e) => setConfirmNickname(e.target.value)}
              placeholder={selected?.nickname ?? "Nickname"}
            />
          </label>
          <label className="block text-sm">
            <span className="text-[var(--text-muted)]">Temporary password</span>
            <input
              type="text"
              required
              minLength={6}
              maxLength={72}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="off"
              className="mt-1 font-mono"
            />
          </label>
          <label className="block text-sm">
            <span className="text-[var(--text-muted)]">Type it again</span>
            <input
              type="text"
              required
              minLength={6}
              maxLength={72}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="off"
              className="mt-1 font-mono"
            />
          </label>
          <button
            type="button"
            className="btn-secondary w-full"
            onClick={() => {
              const next = suggestTempPassword();
              setPassword(next);
              setConfirm(next);
            }}
          >
            Suggest a password I can text
          </button>
          {err && (
            <p className="text-sm text-crimson-400" role="alert">
              {err}
            </p>
          )}
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? "Saving…" : "Save temporary password"}
          </button>
        </form>
      )}
    </section>
  );
}
=======
export {
  SetMemberPasswordForm,
  type SetPasswordMember,
} from "@/components/features/admin/SetMemberPasswordForm";
>>>>>>> b24f51a (Align Admin tabs with audit inventory and split hotspots)

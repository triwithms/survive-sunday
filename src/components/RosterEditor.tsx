"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export type RosterMember = {
  id: string;
  nickname: string;
  realName: string | null;
  status: string;
  role: string;
  email: string | null;
  mirrorFromMembershipId: string | null;
};

export type RosterMirrorOption = {
  id: string;
  nickname: string;
  label: string;
};

export function RosterEditor({
  members,
  mirrorOptions,
}: {
  members: RosterMember[];
  mirrorOptions: RosterMirrorOption[];
}) {
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {msg && (
        <p className="text-sm text-field-400" role="status">
          {msg}
        </p>
      )}
      {err && (
        <p className="text-sm text-crimson-400" role="alert">
          {err}
        </p>
      )}
      <ul className="space-y-3">
        {members.map((m) => (
          <RosterCard
            key={m.id}
            member={m}
            mirrorOptions={mirrorOptions.filter((o) => o.id !== m.id)}
            disabled={busyId !== null && busyId !== m.id}
            busy={busyId === m.id}
            onBusy={(busy) => setBusyId(busy ? m.id : null)}
            onMsg={setMsg}
            onErr={setErr}
          />
        ))}
      </ul>
    </div>
  );
}

function RosterCard({
  member,
  mirrorOptions,
  disabled,
  busy,
  onBusy,
  onMsg,
  onErr,
}: {
  member: RosterMember;
  mirrorOptions: RosterMirrorOption[];
  disabled: boolean;
  busy: boolean;
  onBusy: (busy: boolean) => void;
  onMsg: (msg: string) => void;
  onErr: (err: string) => void;
}) {
  const router = useRouter();
  const [nickname, setNickname] = useState(member.nickname);
  const [realName, setRealName] = useState(member.realName ?? "");
  const [mirrorFrom, setMirrorFrom] = useState(
    member.mirrorFromMembershipId ?? ""
  );

  useEffect(() => {
    setNickname(member.nickname);
    setRealName(member.realName ?? "");
    setMirrorFrom(member.mirrorFromMembershipId ?? "");
  }, [member.nickname, member.realName, member.mirrorFromMembershipId]);

  const dirty =
    nickname.trim() !== member.nickname ||
    realName.trim() !== (member.realName ?? "");
  const mirrorDirty = mirrorFrom !== (member.mirrorFromMembershipId ?? "");

  async function save() {
    onBusy(true);
    onMsg("");
    onErr("");
    try {
      const res = await fetch("/api/admin/roster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membershipId: member.id,
          nickname: nickname.trim(),
          realName: realName.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        onErr(data.error || "Could not save");
        return;
      }
      onMsg(
        `Saved ${data.membership?.nickname}${
          data.membership?.realName ? ` (${data.membership.realName})` : ""
        }`
      );
      router.refresh();
    } catch {
      onErr("Network error — try again");
    } finally {
      onBusy(false);
    }
  }

  async function saveMirror() {
    onBusy(true);
    onMsg("");
    onErr("");
    try {
      const res = await fetch("/api/admin/mirror", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membershipId: member.id,
          sourceMembershipId: mirrorFrom || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        onErr(data.error || "Could not save pick backup");
        return;
      }
      onMsg(
        data.mirrorFromNickname
          ? `${member.nickname} will copy from ${data.mirrorFromNickname} if they still have no pick within 30 minutes of kickoff`
          : `${member.nickname} pick backup is off`
      );
      router.refresh();
    } catch {
      onErr("Network error — try again");
    } finally {
      onBusy(false);
    }
  }

  return (
    <li className="card-glass p-4 space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium">
          {member.nickname}
          {member.realName ? (
            <span className="text-[var(--text-muted)] font-normal">
              {" "}
              · {member.realName}
            </span>
          ) : (
            <span className="text-[var(--text-muted)] font-normal">
              {" "}
              · no real name
            </span>
          )}
        </p>
        <span className="text-xs text-[var(--text-muted)]">
          {member.role === "admin" ? "Commissioner" : member.status.replace("_", " ")}
        </span>
      </div>
      {member.email && (
        <p className="text-xs text-[var(--text-muted)] break-all">{member.email}</p>
      )}
      <label className="block text-sm">
        <span className="text-[var(--text-muted)]">Nickname (what the board shows)</span>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={24}
          disabled={disabled || busy}
          className="mt-1"
          autoComplete="off"
        />
      </label>
      <label className="block text-sm">
        <span className="text-[var(--text-muted)]">Real name</span>
        <input
          value={realName}
          onChange={(e) => setRealName(e.target.value)}
          maxLength={80}
          disabled={disabled || busy}
          className="mt-1"
          autoComplete="name"
          placeholder="e.g. Robert Gama"
        />
      </label>
      {member.role !== "admin" && (
        <label className="block text-sm">
          <span className="text-[var(--text-muted)]">
            If no pick within 30 min of kickoff, copy from
          </span>
          <select
            value={mirrorFrom}
            onChange={(e) => setMirrorFrom(e.target.value)}
            disabled={disabled || busy}
            className="mt-1"
            data-testid={`roster-mirror-${member.nickname}`}
          >
            <option value="">Off</option>
            {mirrorOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      )}
      <button
        type="button"
        className="btn-primary w-full"
        disabled={disabled || busy || !dirty}
        onClick={() => void save()}
      >
        {busy ? "Saving…" : "Save this person"}
      </button>
      {member.role !== "admin" && (
        <button
          type="button"
          className="btn-secondary w-full"
          disabled={disabled || busy || !mirrorDirty}
          onClick={() => void saveMirror()}
        >
          {busy ? "Saving…" : "Save pick backup"}
        </button>
      )}
    </li>
  );
}

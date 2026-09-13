"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { nicknamesMatch } from "@/lib/pool-rules";

type MemberOption = {
  id: string;
  nickname: string;
  status: string;
};

export function TransferCommissionerForm({
  members,
}: {
  members: MemberOption[];
}) {
  const router = useRouter();
  const [membershipId, setMembershipId] = useState(members[0]?.id ?? "");
  const [confirmNickname, setConfirmNickname] = useState("");
  const [understood, setUnderstood] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const selected = members.find((m) => m.id === membershipId);

  async function transfer() {
    if (!selected) {
      setMsg("Choose someone who is already in the pool.");
      return;
    }
    if (!understood) {
      setMsg("Tick the box so we know you understand you will lose Admin.");
      return;
    }
    if (!nicknamesMatch(selected.nickname, confirmNickname)) {
      setMsg("Type their nickname again to confirm.");
      return;
    }
    if (
      !window.confirm(
        `Hand Admin to ${selected.nickname}? You will stay in the pool as a player and lose Admin.`
      )
    ) {
      return;
    }

    setBusy(true);
    setMsg("");
    const res = await fetch("/api/admin/transfer-commissioner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        membershipId: selected.id,
        confirmNickname: confirmNickname.trim(),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error || "Could not transfer.");
      return;
    }
    setMsg(`Done. ${data.transferredTo} now runs the pool. Opening Home…`);
    router.push("/pool");
    router.refresh();
  }

  if (!members.length) {
    return (
      <section className="card-glass p-4 space-y-2">
        <h2 className="font-semibold">Hand the pool to someone else</h2>
        <p className="text-sm text-[var(--text-muted)]">
          There is no other pool member to give Admin to. Invite them first so
          you cannot lock everyone out.
        </p>
      </section>
    );
  }

  return (
    <section className="card-glass p-4 space-y-3">
      <h2 className="font-semibold">Hand the pool to someone else</h2>
      <p className="text-sm text-[var(--text-muted)]">
        Give Admin to another person who is already in this pool. You stay in
        as a player and lose Admin. They keep their picks. This is different
        from Make administrator, which lets more than one person keep Admin
        tools. There is always at least one commissioner.
      </p>
      <ul className="text-xs text-[var(--text-muted)] list-disc pl-5 space-y-1">
        <li>
          They keep their picks and stay on the board (if they were a player).
        </li>
        <li>They also get the Admin screen.</li>
        <li>You lose Admin after this. Use Help if you need to undo it later.</li>
        <li>
          If you were only running the pool (not playing), you become a player
          from the next open week so old missed weeks do not count against you.
        </li>
      </ul>

      <label className="block text-sm space-y-1">
        <span className="text-[var(--text-muted)]">Give Admin to</span>
        <select
          className="w-full min-h-11 rounded-md bg-stadium-800 border border-stadium-border px-3"
          value={membershipId}
          onChange={(e) => {
            setMembershipId(e.target.value);
            setConfirmNickname("");
          }}
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nickname} ({m.status.replace("_", " ")})
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm space-y-1">
        <span className="text-[var(--text-muted)]">
          Type {selected ? selected.nickname : "their nickname"} to confirm
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

      <label className="flex items-start gap-3 text-sm min-h-11">
        <input
          type="checkbox"
          className="mt-1 h-5 w-5 shrink-0 accent-[var(--gold-400,#d4a017)]"
          checked={understood}
          onChange={(e) => setUnderstood(e.target.checked)}
        />
        <span>
          I understand I will lose Admin and {selected?.nickname ?? "they"} will
          run the pool.
        </span>
      </label>

      <button
        type="button"
        className="btn-primary w-full min-h-11"
        disabled={busy || !understood}
        onClick={transfer}
      >
        {busy ? "Transferring…" : "Transfer commissioner"}
      </button>
      {msg && (
        <p className="text-sm text-field-400" role="status">
          {msg}
        </p>
      )}
    </section>
  );
}

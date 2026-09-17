"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { nicknamesMatch } from "@/lib/pool-rules";
import { TransferFields } from "./TransferFields";

type MemberOption = { id: string; nickname: string; status: string };

export function TransferCommissionerForm({ members }: { members: MemberOption[] }) {
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
      <Card as="section" className="p-4 space-y-2">
        <h2 className="font-semibold">Hand the pool to someone else</h2>
        <p className="text-sm text-[var(--text-muted)]">
          There is no other pool member to give Admin to. Invite them first.
        </p>
      </Card>
    );
  }

  return (
    <Card as="section" className="p-4 space-y-3">
      <h2 className="font-semibold">Hand the pool to someone else</h2>
      <p className="text-sm text-[var(--text-muted)]">
        Give Admin to another person already in this pool. You stay as a player
        and lose Admin. Different from Make administrator.
      </p>
      <TransferFields
        members={members}
        selected={selected}
        membershipId={membershipId}
        confirmNickname={confirmNickname}
        understood={understood}
        busy={busy}
        onMembership={(id) => { setMembershipId(id); setConfirmNickname(""); }}
        onConfirm={setConfirmNickname}
        onUnderstood={setUnderstood}
      />
      <Button className="w-full min-h-11" disabled={busy || !understood} onClick={() => void transfer()}>
        {busy ? "Transferring…" : "Transfer commissioner"}
      </Button>
      {msg ? <p className="text-sm text-field-400" role="status">{msg}</p> : null}
    </Card>
  );
}

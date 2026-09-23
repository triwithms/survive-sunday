"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RoleConfirm } from "./admin-role-types";

export function useAdminRole() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [confirm, setConfirm] = useState<RoleConfirm | null>(null);

  async function run() {
    if (!confirm) return;
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const res = await fetch("/api/admin/roles", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId: confirm.id, action: confirm.action }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        nickname?: string;
      };
      if (!res.ok) {
        setErr(data.error || "Couldn’t update administrator access");
        return;
      }
      const name = data.nickname || confirm.nickname;
      setMsg(
        confirm.action === "promote"
          ? `${name} can now open Admin tools.`
          : `${name} is a player only again.`
      );
      setConfirm(null);
      router.refresh();
    } catch {
      setErr("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  return { busy, err, msg, confirm, ask: setConfirm, run };
}

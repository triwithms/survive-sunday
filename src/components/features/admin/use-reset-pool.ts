"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RESET_POOL_CONFIRM } from "@/lib/constants";
import type { ResetPreview } from "./reset-pool-types";

export function useResetPool() {
  const router = useRouter();
  const [preview, setPreview] = useState<ResetPreview | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [typed, setTyped] = useState("");
  const [switchToLive, setSwitchToLive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/reset-pool")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.ok) {
          setPreview({
            poolName: data.poolName,
            pickCount: data.pickCount,
            demoMembersToRemove: data.demoMembersToRemove ?? [],
            membersKept: data.membersKept ?? [],
            weekCount: data.weekCount,
          });
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  async function runReset() {
    if (typed.trim() !== RESET_POOL_CONFIRM) {
      setErr(`Type ${RESET_POOL_CONFIRM} in the box to confirm.`);
      return;
    }
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const res = await fetch("/api/admin/reset-pool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: typed.trim(), switchToLive }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || "Reset failed");
        return;
      }
      setShowConfirm(false);
      setTyped("");
      setMsg(
        `Pool reset. Cleared ${data.pickCount ?? 0} picks, removed ${
          data.removedDemoUsers ?? 0
        } practice accounts, and set the pool to Week 1. Next: Import week picks.`
      );
      router.refresh();
    } catch {
      setErr("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  return {
    preview, showConfirm, setShowConfirm, typed, setTyped, switchToLive,
    setSwitchToLive, busy, msg, err, setMsg, setErr, runReset,
  };
}

"use client";

import { useState } from "react";
import { DEFAULT_SIGNED_IN_PATH } from "@/lib/app-paths";

function signOutToLogin() {
  const form = document.createElement("form");
  form.method = "post";
  form.action = "/api/logout";
  const next = document.createElement("input");
  next.type = "hidden";
  next.name = "callbackUrl";
  next.value = "/login";
  form.append(next);
  document.body.append(form);
  form.submit();
}

export function useDeletePool(poolId: string, poolName: string) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const ready = typed.trim() === poolName.trim() && poolName.trim().length > 0;

  async function runDelete() {
    if (!ready) {
      setErr("Type the pool name exactly to delete it.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/admin/delete-pool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: typed.trim(), poolId }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        signedOut?: boolean;
      };
      if (!res.ok) {
        setErr(data.error || "Delete failed");
        setBusy(false);
        return;
      }
      if (data.signedOut) {
        signOutToLogin();
        return;
      }
      window.location.assign(DEFAULT_SIGNED_IN_PATH);
    } catch {
      setErr("Network error — try again.");
      setBusy(false);
    }
  }

  return {
    showConfirm,
    setShowConfirm,
    typed,
    setTyped,
    busy,
    err,
    setErr,
    ready,
    runDelete,
  };
}

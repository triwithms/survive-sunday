"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function useAdminPost() {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function call(url: string, body: object) {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setMsg(
        !res.ok
          ? data.error || "Couldn’t save."
          : typeof data.summary === "string"
            ? data.summary
            : "Saved."
      );
      if (res.ok) router.refresh();
    } catch {
      setMsg("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  return { msg, busy, call };
}

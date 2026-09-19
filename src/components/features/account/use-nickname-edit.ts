"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const MAX_NICKNAME = 24;

export { MAX_NICKNAME };

export function useNicknameEdit(nickname: string) {
  const router = useRouter();
  const [value, setValue] = useState(nickname);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setValue(nickname), [nickname]);

  async function save() {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Nickname can’t be empty");
      return false;
    }
    if (trimmed.length > MAX_NICKNAME) {
      setError(`Nickname must be ${MAX_NICKNAME} characters or fewer`);
      return false;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/membership/nickname", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: trimmed }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || `Couldn’t update nickname (HTTP ${res.status})`);
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setError("Network error — try again");
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { value, setValue, busy, error, setError, save };
}

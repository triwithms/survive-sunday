"use client";

import { useEffect, useState } from "react";

export type InvitePrefillState = {
  email: string;
  nickname: string;
  expired: boolean;
};

const EMPTY: InvitePrefillState = {
  email: "",
  nickname: "",
  expired: false,
};

export function useInvitePrefill(token: string | null): InvitePrefillState {
  const [state, setState] = useState(EMPTY);

  useEffect(() => {
    const raw = (token ?? "").trim();
    if (!raw) {
      setState(EMPTY);
      return;
    }
    let cancelled = false;
    fetch(`/api/login/invite?token=${encodeURIComponent(raw)}`)
      .then((res) => res.json())
      .then((data: { ok?: boolean; email?: string; nickname?: string }) => {
        if (cancelled) return;
        if (data?.ok) {
          setState({
            email: typeof data.email === "string" ? data.email : "",
            nickname: typeof data.nickname === "string" ? data.nickname : "",
            expired: false,
          });
          return;
        }
        setState({ ...EMPTY, expired: true });
      })
      .catch(() => {
        if (!cancelled) setState({ ...EMPTY, expired: true });
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return state;
}

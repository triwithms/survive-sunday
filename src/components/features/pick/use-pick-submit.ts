"use client";

import { useEffect, useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitPick } from "@/app/actions/submit-pick";
import { applyPickSave, pickSavedMessage } from "./pick-save";
import type { PickMatchup, PickSide } from "./types";

type Confirm = { side: PickSide; matchup: PickMatchup };

export function usePickSubmit(weekNumber: number, currentPick: string | null) {
  const [selected, setSelected] = useState(currentPick ?? null);
  const [optimisticPick, setOptimisticPick] = useOptimistic(selected);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [busy, startTransition] = useTransition();
  const [msg, setMsg] = useState("");
  const [redirectIn, setRedirectIn] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    setSelected(currentPick ?? null);
    setConfirm(null);
    setMsg("");
    setRedirectIn(null);
  }, [weekNumber, currentPick]);

  useEffect(() => {
    if (redirectIn == null) return;
    if (redirectIn <= 0) {
      router.push("/pool");
      return;
    }
    const t = setTimeout(() => setRedirectIn((n) => (n == null ? null : n - 1)), 1000);
    return () => clearTimeout(t);
  }, [redirectIn, router]);

  function submit(abbr: string) {
    startTransition(async () => {
      setOptimisticPick(abbr);
      setMsg("");
      try {
        const data = await submitPick(weekNumber, abbr);
        const outcome = applyPickSave(data, currentPick, abbr);
        if (outcome.kind !== "ok") {
          setMsg(outcome.message);
          if (outcome.kind === "locked") router.refresh();
          return;
        }
        setSelected(abbr);
        setConfirm(null);
        setMsg(pickSavedMessage(outcome.changed));
        setRedirectIn(2);
        router.refresh();
      } catch {
        setMsg("Could not save pick");
      }
    });
  }

  return {
    selected: optimisticPick,
    confirm,
    busy,
    msg,
    redirectIn,
    onPick: (side: PickSide, matchup: PickMatchup) => setConfirm({ side, matchup }),
    onCancel: () => {
      if (!busy) setConfirm(null);
    },
    onConfirm: () => {
      if (confirm && !busy) submit(confirm.side.abbr);
    },
  };
}

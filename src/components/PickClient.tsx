"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isGameStarted } from "@/lib/pick-change";
import { pickScreenCopy } from "@/lib/next-week-picks";
import { submitPick } from "@/app/actions/submit-pick";
import { PickScreen } from "@/components/features/pick/PickScreen";
import {
  pickChangeHint,
  pickEmptyMessage,
  type PickClientProps,
} from "@/components/features/pick/pick-copy";
import type { PickMatchup, PickSide } from "@/components/features/pick";

export function PickClient({
  weekNumber, decision, locked, canChange, eliminated,
  spectator = false, currentPick, games,
}: PickClientProps) {
  const [selected, setSelected] = useState(currentPick ?? null);
  const [confirm, setConfirm] = useState<{ side: PickSide; matchup: PickMatchup } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [redirectIn, setRedirectIn] = useState<number | null>(null);
  const router = useRouter();
  const copy = pickScreenCopy({
    weekNumber, decision, locked, canChange, eliminated, spectator,
    hasCurrentPick: Boolean(currentPick),
  });
  const lockStarted = copy.showWeek1ChangeCard && locked && canChange;
  const readOnly = !canChange || eliminated || spectator;
  const list = Array.isArray(games) ? games : [];

  useEffect(() => {
    setSelected(currentPick ?? null);
    setConfirm(null);
    setMsg("");
    setRedirectIn(null);
  }, [weekNumber, currentPick]);

  useEffect(() => {
    if (redirectIn == null) return;
    if (redirectIn <= 0) { router.push("/pool"); return; }
    const t = setTimeout(() => setRedirectIn((n) => (n == null ? null : n - 1)), 1000);
    return () => clearTimeout(t);
  }, [redirectIn, router]);

  async function submit(abbr: string) {
    setBusy(true);
    setMsg("");
    try {
      const data = await submitPick(weekNumber, abbr);
      if (!data.ok) {
        if (data.locked || /locked/i.test(data.error || "")) {
          setMsg(data.error || "Week is locked — picks cannot change");
          router.refresh();
          return;
        }
        setMsg(data.error || "Could not save pick");
        return;
      }
      setSelected(abbr);
      setConfirm(null);
      setMsg(currentPick && currentPick !== abbr
        ? "Pick updated — heading back to pool…"
        : "Locked in — heading back to pool…");
      setRedirectIn(2);
      router.refresh();
    } catch { setMsg("Could not save pick"); }
    finally { setBusy(false); }
  }

  return (
    <PickScreen
      weekNumber={weekNumber}
      copy={copy}
      list={list}
      selectedAbbr={selected ?? currentPick}
      currentPick={currentPick}
      readOnly={readOnly}
      lockStarted={lockStarted}
      spectator={spectator}
      eliminated={eliminated}
      msg={msg}
      redirectIn={redirectIn}
      tipWeek={copy.showDismissibleTip ? decision.nextWeek : null}
      confirm={confirm}
      busy={busy}
      emptyMessage={pickEmptyMessage(readOnly, weekNumber, decision, copy.banner?.title)}
      changeHint={pickChangeHint(readOnly, copy.showWeek1ChangeCard)}
      onPick={(side, matchup) => {
        if (readOnly || side.alreadyUsed) return;
        if (lockStarted && isGameStarted(matchup)) return;
        setConfirm({ side, matchup });
      }}
      onCancel={() => setConfirm(null)}
      onConfirm={() => { if (confirm) void submit(confirm.side.abbr); }}
    />
  );
}

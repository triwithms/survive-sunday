"use client";

import { isGameStarted } from "@/lib/pick-change";
import { pickScreenCopy } from "@/lib/next-week-picks";
import { PickScreen } from "@/components/features/pick/PickScreen";
import { PickOutOverlay } from "@/components/features/pick/PickOutOverlay";
import {
  pickChangeHint,
  pickEmptyMessage,
  type PickClientProps,
} from "@/components/features/pick/pick-copy";
import { usePickSubmit } from "@/components/features/pick/use-pick-submit";

export function PickClient({
  weekNumber, decision, locked, canChange, eliminated,
  spectator = false, currentPick, games,
}: PickClientProps) {
  const copy = pickScreenCopy({
    weekNumber, decision, locked, canChange, eliminated, spectator,
    hasCurrentPick: Boolean(currentPick),
  });
  const lockStarted = copy.showWeek1ChangeCard && locked && canChange;
  const readOnly = !canChange || eliminated || spectator;
  const list = Array.isArray(games) ? games : [];
  const pick = usePickSubmit(weekNumber, currentPick, { disabled: eliminated });

  if (eliminated) {
    return <PickOutOverlay />;
  }

  return (
    <PickScreen
      weekNumber={weekNumber}
      copy={copy}
      list={list}
      selectedAbbr={pick.selected ?? currentPick}
      currentPick={currentPick}
      readOnly={readOnly}
      lockStarted={lockStarted}
      spectator={spectator}
      msg={pick.msg}
      redirectIn={pick.redirectIn}
      tipWeek={copy.showDismissibleTip ? decision.nextWeek : null}
      confirm={pick.confirm}
      busy={pick.busy}
      emptyMessage={pickEmptyMessage(readOnly, weekNumber, decision, copy.banner?.title)}
      changeHint={pickChangeHint(readOnly, copy.showWeek1ChangeCard)}
      onPick={(side, matchup) => {
        if (readOnly || side.alreadyUsed) return;
        if (lockStarted && isGameStarted(matchup)) return;
        pick.onPick(side, matchup);
      }}
      onCancel={pick.onCancel}
      onConfirm={pick.onConfirm}
    />
  );
}

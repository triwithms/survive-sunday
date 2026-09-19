import { PickConfirmPanel } from "./PickConfirmPanel";
import { PickCurrentCard } from "./PickCurrentCard";
import { PickGameList } from "./PickGameList";
import { PickHeader } from "./PickHeader";
import { PickNotices } from "./PickNotices";
import type { PickMatchup, PickSide } from "./types";
import type { PickScreenCopy } from "@/lib/next-week-picks";

type Confirm = { side: PickSide; matchup: PickMatchup };

export function PickScreen({
  weekNumber,
  copy,
  list,
  selectedAbbr,
  currentPick,
  readOnly,
  lockStarted,
  spectator,
  msg,
  redirectIn,
  tipWeek,
  confirm,
  busy,
  emptyMessage,
  changeHint,
  onPick,
  onCancel,
  onConfirm,
}: {
  weekNumber: number;
  copy: PickScreenCopy;
  list: PickMatchup[];
  selectedAbbr: string | null;
  currentPick: string | null;
  readOnly: boolean;
  lockStarted: boolean;
  spectator: boolean;
  msg: string;
  redirectIn: number | null;
  tipWeek: number | null;
  confirm: Confirm | null;
  busy: boolean;
  emptyMessage: string;
  changeHint: string | null;
  onPick: (side: PickSide, matchup: PickMatchup) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="space-y-4">
      <PickHeader weekNumber={weekNumber} kicker={copy.kicker} />
      <PickCurrentCard
        games={list}
        selectedAbbr={selectedAbbr}
        readOnly={readOnly}
        changeHint={changeHint}
        emptyMessage={emptyMessage}
        saving={busy}
      />
      <PickNotices
        spectator={spectator}
        week1Change={copy.showWeek1ChangeCard}
        tipWeek={tipWeek}
        banner={copy.banner}
        msg={msg}
        redirectIn={redirectIn}
      />
      <PickGameList
        weekNumber={weekNumber}
        games={list}
        selectedAbbr={selectedAbbr}
        readOnly={readOnly}
        lockStarted={lockStarted}
        onPick={onPick}
      />
      {confirm ? (
        <PickConfirmPanel
          side={confirm.side}
          matchup={confirm.matchup}
          busy={busy}
          readOnly={readOnly}
          confirmLabel={busy ? "Saving…" : currentPick ? "Change pick" : "Lock in"}
          error={busy ? "" : msg}
          onCancel={onCancel}
          onConfirm={onConfirm}
        />
      ) : null}
    </div>
  );
}

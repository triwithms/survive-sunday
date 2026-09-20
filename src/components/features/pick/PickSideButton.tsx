import { Button } from "@/components/ui";
import { formatCurrentStanding, formatPriorYearRank } from "@/lib/matchup-meta";
import { PickSideTeamLink } from "./PickSideTeamLink";
import type { PickSide } from "./types";

export function PickSideButton({
  side,
  selected,
  readOnly,
  gameClosed,
  align,
  onPick,
}: {
  side: PickSide;
  selected: boolean;
  readOnly: boolean;
  gameClosed?: boolean;
  align: "away" | "home";
  onPick: () => void;
}) {
  const disabled = readOnly || side.alreadyUsed || !!gameClosed;
  const isAway = align === "away";
  const prior = formatPriorYearRank(side.priorYearRank);
  const current = formatCurrentStanding(side.standing);

  return (
    <div
      className={`flex min-h-[88px] min-w-0 flex-col gap-1.5 rounded-lg border p-2 transition duration-75 sm:p-3 ${
        isAway ? "items-start text-left" : "items-end text-right"
      } ${
        selected
          ? "border-gold-400 bg-gold-400/10 ring-2 ring-gold-400"
          : "border-transparent bg-[var(--stadium-700)]/40"
      } ${side.alreadyUsed && !selected ? "opacity-40" : ""}`}
    >
      <PickSideTeamLink side={side} reverse={!isAway} />
      {(prior || current) && (
        <div
          className={`w-full space-y-0.5 text-[10px] leading-tight text-[var(--text-muted)] ${
            isAway ? "text-left" : "text-right"
          }`}
        >
          {prior && <div>{prior}</div>}
          {current && <div>{current}</div>}
        </div>
      )}
      {side.alreadyUsed ? (
        <div className="text-[10px] font-medium text-crimson-400">Already used</div>
      ) : gameClosed && !selected ? (
        <div className="text-[10px] font-medium text-[var(--text-muted)]">
          Game started
        </div>
      ) : !readOnly ? (
        <Button
          disabled={disabled && !selected}
          onClick={(e) => {
            e.stopPropagation();
            if (readOnly || side.alreadyUsed || gameClosed) return;
            onPick();
          }}
          aria-pressed={selected}
          aria-label={`Pick ${side.name} (${side.abbr})`}
          className={`w-full text-xs py-1.5 ${selected ? "ring-1 ring-gold-400" : ""}`}
        >
          {selected ? "Selected · confirm" : "Pick"}
        </Button>
      ) : selected ? (
        <div className="text-[10px] font-medium text-gold-400">Your pick</div>
      ) : null}
    </div>
  );
}

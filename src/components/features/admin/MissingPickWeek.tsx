"use client";

import { Button } from "@/components/ui";
import {
  missingPickChatText,
  type MissingPickWeekView,
} from "@/lib/missing-pick-who";
import { useMissingPick } from "./use-missing-pick";

export function MissingPickWeek(props: {
  week: MissingPickWeekView;
  pickUrl: string;
}) {
  const m = useMissingPick();
  const names = props.week.blanks.map((blank) => blank.nickname);
  const text = missingPickChatText({
    weekNumber: props.week.weekNumber,
    nicknames: names,
    appUrl: props.pickUrl,
  });
  const empty = names.length === 0;

  return (
    <div
      className="space-y-2"
      data-testid={`missing-pick-week-${props.week.weekNumber}`}
    >
      <p className="text-sm font-medium">
        Week {props.week.weekNumber}
        <span className="font-normal text-[var(--text-muted)]">
          {" "}
          · lock {props.week.lockLabel}
        </span>
      </p>
      {empty ? (
        <p className="text-sm text-[var(--text-muted)]">Everyone has a pick.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {props.week.blanks.map((blank) => (
            <li key={blank.membershipId} data-testid="missing-pick-name">
              {blank.nickname}
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          className="min-h-11 flex-1"
          disabled={m.busy || empty}
          onClick={() => void m.send(props.week.weekId)}
          data-testid="missing-pick-send"
        >
          {m.busy ? "Sending…" : "Send reminders"}
        </Button>
        <Button
          variant="secondary"
          className="min-h-11 flex-1"
          disabled={empty}
          onClick={() => void m.copy(text)}
          data-testid="missing-pick-copy"
        >
          {m.copied ? "Copied" : "Copy text"}
        </Button>
      </div>
      {m.note ? (
        <p className="text-sm text-gold-400" role="status">
          {m.note}
        </p>
      ) : null}
      {m.err ? <p className="text-sm text-crimson-400">{m.err}</p> : null}
    </div>
  );
}

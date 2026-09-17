import type { ReactNode } from "react";
import { AutoPickStamps } from "@/components/AutoPickStamps";
import { StatusChip } from "@/components/StatusChip";
import type { HomeRow } from "./types";

function resultClass(result: string | null) {
  if (result === "win") return "text-field-400";
  if (result === "loss") return "text-crimson-400";
  return "text-[var(--text-muted)]";
}

export function HomeParticipantItem({
  row,
  isSelf,
  extra,
  below,
}: {
  row: HomeRow;
  isSelf: boolean;
  extra?: ReactNode;
  below?: ReactNode;
}) {
  return (
    <li
      className={`card-glass p-3 ${row.status === "eliminated" ? "opacity-60" : ""}`}
    >
      <div className={below ? "min-w-0" : undefined}>
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="font-medium min-w-0">
            {row.nickname}
            <AutoPickStamps count={row.autoPickStamps} />
            {isSelf ? " (you)" : ""}
            {row.realName ? (
              <span className="text-xs font-normal text-[var(--text-muted)]">
                {" "}({row.realName})
              </span>
            ) : null}
          </span>
          <StatusChip status={row.status} />
          {extra}
        </div>
        {below}
      </div>
    </li>
  );
}

export function HomeRevealedExtra({ row }: { row: HomeRow }) {
  const pick = row.pick;
  if (!pick) return null;
  return (
    <>
      {pick.result ? (
        <span className={`text-sm font-medium ${resultClass(pick.result)}`}>
          {pick.result}
        </span>
      ) : null}
      {pick.source === "imported" ? (
        <span className="text-xs text-[var(--text-muted)]">imported</span>
      ) : null}
    </>
  );
}

export function HomeMissedExtra({ row }: { row: HomeRow }) {
  return (
    <>
      <span className="text-sm text-[var(--text-muted)]">
        {row.missed ? "Missed pick" : "No pick"}
      </span>
      {row.missed && row.missedResult ? (
        <span className={`text-sm font-medium ${resultClass(row.missedResult)}`}>
          {row.missedResult}
        </span>
      ) : null}
    </>
  );
}

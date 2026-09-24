import type { ReactNode } from "react";
import { AutoPickStamps } from "@/components/AutoPickStamps";
import { Card, StatusBadge, type StatusBadgeStatus } from "@/components/ui";
import { STATUS_LABELS } from "@/lib/constants";

const STATUSES = ["undefeated", "one_loss", "eliminated"] as const;

function badgeStatus(status: string): StatusBadgeStatus {
  return (STATUSES as readonly string[]).includes(status)
    ? (status as StatusBadgeStatus)
    : "undefeated";
}

export function BoardParticipantRow({
  rank,
  nickname,
  autoPickStamps,
  isSelf,
  realName,
  status,
  meta,
  children,
}: {
  rank?: number;
  nickname: string;
  autoPickStamps?: number | null;
  isSelf?: boolean;
  realName?: string | null;
  status: string;
  meta?: string;
  children?: ReactNode;
}) {
  return (
    <Card
      as="li"
      data-share-chunk=""
      data-share-row=""
      data-status={status}
      className={`p-3 flex items-center gap-2 sm:gap-3 min-w-0 ${
        status === "eliminated" ? "opacity-80" : ""
      }`}
    >
      {rank != null ? (
        <span className="text-[var(--text-muted)] min-w-[1.25rem] text-sm font-mono tabular-nums shrink-0">
          {rank}
        </span>
      ) : null}
      <div className="flex-1 min-w-0">
        <div className="font-medium break-words">
          {nickname}
          <AutoPickStamps count={autoPickStamps} />
          {isSelf ? " (you)" : ""}
          {realName ? (
            <span className="text-xs font-normal text-[var(--text-muted)]">
              {" "}
              ({realName})
            </span>
          ) : null}
        </div>
        {meta ? (
          <div className="text-xs text-[var(--text-muted)] break-words">{meta}</div>
        ) : null}
      </div>
      <div className="shrink-0 flex flex-col items-end gap-1.5">
        <StatusBadge status={badgeStatus(status)}>
          {STATUS_LABELS[status] || status}
        </StatusBadge>
        {children}
      </div>
    </Card>
  );
}

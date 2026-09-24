"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import {
  isTripleTap,
  recordTapTimes,
  SHARE_OPEN_EVENT,
} from "@/lib/share-export";
import { headerPoolWeekLabel } from "@/lib/header-week-selection";

export function isLeaderboardPath(path: string): boolean {
  return path === "/standings" || path.startsWith("/standings/");
}

export function weekAllowsShare(path: string): boolean {
  return (
    !isLeaderboardPath(path) &&
    (path === "/scores" || path.startsWith("/scores/"))
  );
}

export function WeekBadge({
  weekNumber,
  allowShareGesture,
}: {
  weekNumber: number;
  allowShareGesture?: boolean;
}) {
  const taps = useRef<number[]>([]);

  function onWeekClick() {
    if (!allowShareGesture) return;
    taps.current = recordTapTimes(taps.current, Date.now());
    if (isTripleTap(taps.current)) {
      taps.current = [];
      window.dispatchEvent(new Event(SHARE_OPEN_EVENT));
    }
  }

  return (
    <span
      role="status"
      className="shrink-0 select-none whitespace-nowrap text-sm font-medium text-gold-400 cursor-default"
      data-testid="header-week-badge"
      onClick={allowShareGesture ? onWeekClick : undefined}
    >
      {headerPoolWeekLabel(weekNumber)}
    </span>
  );
}

export function HeaderWeekBadge({ weekNumber }: { weekNumber: number }) {
  const pathname = usePathname();
  if (isLeaderboardPath(pathname)) {
    return <div className="min-w-0 flex-1" aria-hidden />;
  }
  return (
    <div className="flex items-center gap-1.5 sm:gap-2 text-sm min-w-0 flex-1 justify-center">
      <WeekBadge
        weekNumber={weekNumber}
        allowShareGesture={weekAllowsShare(pathname)}
      />
    </div>
  );
}

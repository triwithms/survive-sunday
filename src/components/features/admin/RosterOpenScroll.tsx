"use client";

import { useEffect } from "react";

/** Scroll a deep-linked player into view once the roster is on screen. */
export function RosterOpenScroll({ memberId }: { memberId: string | null }) {
  useEffect(() => {
    if (!memberId) return;
    document
      .querySelector(`[data-testid="roster-toggle-${memberId}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [memberId]);
  return null;
}

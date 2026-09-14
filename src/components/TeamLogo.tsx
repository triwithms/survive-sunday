"use client";

import { useState } from "react";

/** Shared ESPN mark sizes. Compact is the default for Scores / Board / League rows. */
export const TEAM_LOGO_SIZE = {
  /** Scores game rows + friend picks — modest, scorebug-safe. */
  compact: 32,
  /** Board, League, Scores detail — same family, a bit more room. */
  row: 36,
  /** Pick slate matchup sides. */
  slate: 50,
  /** Current pick / confirm dialog. */
  featured: 64,
  /** Team research header only — do not use in lists. */
  hero: 72,
} as const;

export function TeamLogo({
  abbr,
  logoUrl,
  size = TEAM_LOGO_SIZE.compact,
}: {
  abbr: string;
  logoUrl: string | null;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  if (!logoUrl || failed) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-md bg-[var(--stadium-700)] font-mono text-[10px] font-semibold text-gold-400"
        style={{ width: size, height: size }}
        aria-hidden
      >
        {abbr.slice(0, 3)}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-md object-contain bg-white"
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  );
}

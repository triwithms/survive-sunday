"use client";

import { useCallback, useState } from "react";
import { resolveTeamLogoSrc } from "@/lib/team-helmets";
import { TEAM_LOGO_SIZE } from "@/lib/team-logo-size";

export { TEAM_LOGO_SIZE };

export function TeamLogo({
  abbr,
  size = TEAM_LOGO_SIZE.compact,
}: {
  /** Any app abbr, ESPN/feed alias (WSH, LA, JAC…), or team name. */
  abbr: string | null | undefined;
  /** Ignored — logos are local `/helmets/{abbr}.png` only. */
  logoUrl?: string | null;
  size?: number;
}) {
  const [failed, setFailed] = useState<string[]>([]);
  const src = resolveTeamLogoSrc(abbr, null, failed);
  const markFailed = useCallback((bad: string) => {
    setFailed((prev) => (prev.includes(bad) ? prev : [...prev, bad]));
  }, []);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={src}
      // SSR <img> can 404 before hydration attaches onError; catch it on mount.
      ref={(img) => {
        if (img?.complete && img.naturalWidth === 0) markFailed(src);
      }}
      src={src}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-md object-contain bg-stadium-800"
      style={{ width: size, height: size }}
      onError={() => markFailed(src)}
    />
  );
}

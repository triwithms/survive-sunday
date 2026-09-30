"use client";

import { useEffect, useRef, useState } from "react";
import { useTeamLogosOn } from "@/components/TeamLogosContext";
import { resolveTeamLogoSrc, TEAM_HELMET_PLACEHOLDER } from "@/lib/team-helmets";
import { TEAM_LOGO_SIZE } from "@/lib/team-logo-size";
import { teamMarkFontPx, teamMarkText } from "@/lib/team-logos";

export { TEAM_LOGO_SIZE };

type TeamLogoProps = {
  abbr: string;
  /** Ignored — logos are local `/helmets/{file}.png` only (see `team-abbr.ts`). */
  logoUrl?: string | null;
  size?: number;
};

/**
 * The one team mark. Helmet when the pool shows logos, otherwise a neutral
 * abbreviation badge in the same square so rows do not shift.
 */
export function TeamLogo(props: TeamLogoProps) {
  return useTeamLogosOn() ? <TeamHelmet {...props} /> : <TeamBadge {...props} />;
}

/**
 * inline-block + overflow-hidden puts the baseline on the bottom edge, the
 * same as an inline <img>, so non-flex parents line up identically.
 */
export function TeamBadge({ abbr, size = TEAM_LOGO_SIZE.compact }: TeamLogoProps) {
  return (
    <span
      aria-hidden="true"
      data-team-badge=""
      className="inline-block shrink-0 overflow-hidden whitespace-nowrap rounded-md border border-stadium-border bg-stadium-800 text-center font-sans font-bold tracking-tight text-[var(--text-primary)]"
      style={{
        width: size,
        height: size,
        lineHeight: `${Math.max(0, size - 2)}px`,
        fontSize: teamMarkFontPx(size),
      }}
    >
      {teamMarkText(abbr)}
    </span>
  );
}

function TeamHelmet({ abbr, size = TEAM_LOGO_SIZE.compact }: TeamLogoProps) {
  const [failed, setFailed] = useState<string[]>([]);
  const src = resolveTeamLogoSrc(abbr, null, failed);
  const ref = useRef<HTMLImageElement>(null);

  function markFailed() {
    setFailed((prev) => (prev.includes(src) ? prev : [...prev, src]));
  }

  // Server-rendered <img> can fail before hydration attaches onError.
  useEffect(() => {
    const img = ref.current;
    if (src === TEAM_HELMET_PLACEHOLDER || !img) return;
    if (img.complete && img.naturalWidth === 0) markFailed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      key={src}
      src={src}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-md object-contain bg-stadium-800"
      style={{ width: size, height: size }}
      onError={src === TEAM_HELMET_PLACEHOLDER ? undefined : markFailed}
    />
  );
}

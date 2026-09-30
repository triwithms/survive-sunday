"use client";

import { useEffect, useRef, useState } from "react";
import { resolveTeamLogoSrc, TEAM_HELMET_PLACEHOLDER } from "@/lib/team-helmets";
import { TEAM_LOGO_SIZE } from "@/lib/team-logo-size";

export { TEAM_LOGO_SIZE };

export function TeamLogo({
  abbr,
  size = TEAM_LOGO_SIZE.compact,
}: {
  abbr: string;
  /** Ignored — logos are local `/helmets/{file}.png` only (see `team-abbr.ts`). */
  logoUrl?: string | null;
  size?: number;
}) {
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

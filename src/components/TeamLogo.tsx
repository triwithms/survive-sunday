"use client";

import { useState } from "react";
import { resolveTeamLogoSrc } from "@/lib/espn-teams";
import { TEAM_LOGO_SIZE } from "@/lib/team-logo-size";

export { TEAM_LOGO_SIZE };

export function TeamLogo({
  abbr,
  logoUrl,
  size = TEAM_LOGO_SIZE.compact,
}: {
  abbr: string;
  logoUrl: string | null;
  size?: number;
}) {
  const [broken, setBroken] = useState<string | null>(null);
  const src = resolveTeamLogoSrc(abbr, logoUrl, broken);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={src}
      src={src}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-md object-contain bg-white"
      style={{ width: size, height: size }}
      onError={() => setBroken(src)}
    />
  );
}

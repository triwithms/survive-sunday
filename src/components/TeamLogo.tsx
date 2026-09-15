"use client";

import { useEffect, useState } from "react";
import { espnTeamLogoUrl } from "@/lib/espn-teams";
import { TEAM_LOGO_SIZE } from "@/lib/team-logo-size";

export { TEAM_LOGO_SIZE };

function LetterFallback({ abbr, size }: { abbr: string; size: number }) {
  const label = abbr.trim().slice(0, 3).toUpperCase() || "—";
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-md bg-[var(--stadium-700)] font-mono font-semibold text-gold-400 ${
        size >= 48 ? "text-xs" : "text-[10px]"
      }`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {label}
    </div>
  );
}

export function TeamLogo({
  abbr,
  logoUrl,
  size = TEAM_LOGO_SIZE.compact,
}: {
  abbr: string;
  logoUrl: string | null;
  size?: number;
}) {
  const espnSrc = espnTeamLogoUrl(abbr);
  const preferred = logoUrl?.trim() || espnSrc;
  const [src, setSrc] = useState(preferred);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(!preferred);

  useEffect(() => {
    const next = logoUrl?.trim() || espnTeamLogoUrl(abbr);
    setSrc(next);
    setReady(false);
    setFailed(!next);
  }, [abbr, logoUrl]);

  if (failed || !src) {
    return <LetterFallback abbr={abbr} size={size} />;
  }

  return (
    <span
      className="relative inline-flex shrink-0"
      style={{ width: size, height: size }}
    >
      {!ready ? (
        <span className="absolute inset-0">
          <LetterFallback abbr={abbr} size={size} />
        </span>
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className={`relative shrink-0 rounded-md object-contain ${
          ready ? "bg-white" : "opacity-0"
        }`}
        style={{ width: size, height: size }}
        onLoad={() => setReady(true)}
        onError={() => {
          const fallback = espnTeamLogoUrl(abbr);
          if (src !== fallback) {
            setSrc(fallback);
            setReady(false);
          } else {
            setFailed(true);
          }
        }}
      />
    </span>
  );
}

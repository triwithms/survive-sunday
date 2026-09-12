"use client";

import { useState } from "react";

export function TeamLogo({
  abbr,
  logoUrl,
  size = 40,
}: {
  abbr: string;
  logoUrl: string | null;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  if (!logoUrl || failed) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-full bg-[var(--stadium-700)] font-mono text-xs font-semibold text-gold-400"
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
      className="shrink-0 rounded-full object-contain bg-[var(--stadium-700)]"
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  );
}

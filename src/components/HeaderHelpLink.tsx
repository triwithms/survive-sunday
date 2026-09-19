"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function HeaderHelpLink() {
  const path = usePathname();
  const active = path === "/help" || path.startsWith("/help/");

  return (
    <Link
      href="/help"
      prefetch={false}
      aria-label="Help"
      title="Help"
      data-testid="header-help"
      className={`shrink-0 inline-flex items-center justify-center min-h-11 min-w-11 rounded-full border text-lg font-semibold leading-none touch-manipulation ${
        active
          ? "border-gold-400 text-gold-400 bg-gold-400/10"
          : "border-stadium-border text-[var(--text-muted)] hover:border-gold-400/60 hover:text-gold-400"
      }`}
    >
      ?
    </Link>
  );
}

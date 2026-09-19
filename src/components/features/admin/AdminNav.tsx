"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_TABS } from "./admin-tabs";

export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Admin tabs" className="space-y-2" data-testid="admin-tabs">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
        Admin
      </p>
      <div className="grid grid-cols-4 gap-1">
        {ADMIN_TABS.map((tab) => {
          const active = tab.match(path);
          const className = [
            "min-h-11 px-1 text-xs font-semibold rounded-lg border inline-flex items-center justify-center text-center",
            active
              ? "border-gold-400 text-gold-400 bg-gold-400/10"
              : "border-stadium-border text-[var(--text-muted)]",
          ].join(" ");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              prefetch={false}
              title={tab.blurb}
              aria-current={active ? "page" : undefined}
              className={className}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

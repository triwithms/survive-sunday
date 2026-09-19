"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_TABS } from "./admin-tabs";

export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Admin menus" className="space-y-2">
      <Link
        href="/admin"
        prefetch={false}
        className="text-sm text-gold-400"
      >
        Admin
      </Link>
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ADMIN_TABS.map((tab) => {
          const active = tab.match(path);
          const className = [
            "shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] sm:text-xs font-medium border min-h-11 inline-flex items-center",
            active
              ? "border-gold-400 text-gold-400 bg-gold-400/10"
              : "border-stadium-border text-[var(--text-muted)] hover:border-gold-400/60 hover:text-gold-400",
          ].join(" ");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              prefetch={false}
              title={tab.name}
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

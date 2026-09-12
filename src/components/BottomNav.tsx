"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Target, Radio, ListOrdered, HelpCircle, Shield } from "lucide-react";

const items = [
  { href: "/pool", label: "Home", icon: Home },
  { href: "/pick", label: "Pick", icon: Target },
  { href: "/scores", label: "Scores", icon: Radio },
  { href: "/standings", label: "Board", icon: ListOrdered },
  { href: "/help", label: "Help", icon: HelpCircle },
];

export function BottomNav({ isAdmin }: { isAdmin?: boolean }) {
  const path = usePathname();
  const nav = isAdmin
    ? [...items.slice(0, 4), { href: "/admin", label: "Admin", icon: Shield }]
    : items;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-stadium-border bg-stadium-900/95 backdrop-blur pb-[env(safe-area-inset-bottom)] overflow-x-hidden">
      <ul className="mx-auto flex max-w-pool w-full justify-between sm:justify-around px-1 sm:px-2 py-2 min-w-0">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path === href || path.startsWith(href + "/");
          return (
            <li key={href} className="min-w-0 flex-1">
              <Link
                href={href}
                className={`flex flex-col items-center gap-0.5 px-0.5 sm:px-2 py-1 text-[10px] sm:text-[11px] min-w-0 ${
                  active ? "text-gold-400" : "text-[var(--text-muted)]"
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.4 : 1.75} />
                <span className="truncate max-w-full">{label}</span>
                {active && (
                  <span className="h-0.5 w-5 sm:w-6 rounded-full bg-gold-400" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

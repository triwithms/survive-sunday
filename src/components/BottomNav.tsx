"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Target,
  Radio,
  Trophy,
  ListOrdered,
  HelpCircle,
  Shield,
} from "lucide-react";

const items = [
  { href: "/pool", label: "Home", icon: Home },
  { href: "/pick", label: "Pick", icon: Target },
  { href: "/scores", label: "Scores", icon: Radio },
  { href: "/nfl", label: "League", icon: Trophy },
  { href: "/standings", label: "Board", icon: ListOrdered },
  { href: "/help", label: "Help", icon: HelpCircle },
];

export function BottomNav({ isAdmin }: { isAdmin?: boolean }) {
  const path = usePathname();
  const nav = isAdmin
    ? [...items.slice(0, 5), { href: "/admin", label: "Admin", icon: Shield }]
    : items;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-stadium-border bg-stadium-900/95 backdrop-blur pb-[env(safe-area-inset-bottom)] overflow-x-hidden">
      <ul className="mx-auto flex max-w-pool w-full justify-between sm:justify-around px-0.5 sm:px-2 py-2 min-w-0">
        {nav.map(({ href, label, icon: Icon }) => {
          const active =
            path === href ||
            path.startsWith(href + "/") ||
            (href === "/nfl" && path.startsWith("/team/"));
          return (
            <li key={href} className="min-w-0 flex-1">
              <Link
                href={href}
                prefetch={false}
                className={`flex flex-col items-center gap-0.5 px-0.5 sm:px-1 py-1 text-[9px] sm:text-[11px] min-w-0 ${
                  active ? "text-gold-400" : "text-[var(--text-muted)]"
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2.4 : 1.75} className="sm:w-5 sm:h-5" />
                <span className="truncate max-w-full">{label}</span>
                {active && (
                  <span className="h-0.5 w-4 sm:w-6 rounded-full bg-gold-400" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import {
  Target,
  Users,
  Trophy,
  Radio,
  Calendar,
  ListOrdered,
  Shield,
} from "lucide-react";

const items = [
  { href: "/pick", label: "My pick", icon: Target },
  { href: "/pool", label: "Selections", icon: Users },
  { href: "/standings", label: "Leaderboard", icon: Trophy },
  { href: "/scores", label: "Scores", icon: Radio },
  { href: "/schedule", label: "Schedule", icon: Calendar },
  { href: "/nfl", label: "Standings", icon: ListOrdered },
];

export function BottomNav({ isAdmin }: { isAdmin?: boolean }) {
  const path = usePathname();
  const nav = isAdmin
    ? [...items, { href: "/admin", label: "Admin", icon: Shield }]
    : items;

  return (
    <nav
      data-share-chrome=""
      className="fixed bottom-0 inset-x-0 z-40 border-t border-stadium-border bg-stadium-900/95 backdrop-blur pb-[env(safe-area-inset-bottom)] overflow-x-hidden"
    >
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
                className={`flex flex-col items-center gap-0.5 px-0.5 sm:px-1 py-1 text-[9px] sm:text-[11px] min-w-0 touch-manipulation transition-transform duration-75 active:scale-95 ${
                  active ? "text-gold-400" : "text-[var(--text-muted)] active:text-gold-400/80"
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2.4 : 1.75} className="sm:w-5 sm:h-5" />
                <span className="truncate max-w-full">{label}</span>
                <NavPulse active={active} />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function NavPulse({ active }: { active: boolean }) {
  const { pending } = useLinkStatus();
  if (active) {
    return <span className="h-0.5 w-4 sm:w-6 rounded-full bg-gold-400" />;
  }
  if (!pending) return null;
  return (
    <span className="h-0.5 w-4 sm:w-6 rounded-full bg-gold-400/70 animate-pulse" />
  );
}

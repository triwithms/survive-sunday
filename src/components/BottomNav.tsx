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
  type LucideIcon,
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
      data-app-nav=""
      className="sticky bottom-0 shrink-0 z-40 border-t border-stadium-border bg-stadium-900/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex max-w-pool w-full justify-between sm:justify-around px-0.5 sm:px-2 py-2 min-w-0">
        {nav.map(({ href, label, icon }) => {
          const active =
            path === href ||
            path.startsWith(href + "/") ||
            (href === "/nfl" && path.startsWith("/team/"));
          return (
            <li key={href} className="min-w-0 flex-1">
              <Link
                href={href}
                prefetch={false}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 px-0.5 py-1 text-center text-[0.7rem] leading-tight min-w-0 touch-manipulation transition-transform duration-75 active:scale-95 sm:px-1 ${
                  active ? "text-gold-400" : "text-[var(--text-muted)] active:text-gold-400/80"
                }`}
              >
                <NavTab icon={icon} label={label} active={active} />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** `useLinkStatus` only works under a Link. No extra fetch — prefetch stays off. */
function NavTab({
  icon: Icon,
  label,
  active,
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
}) {
  const { pending } = useLinkStatus();
  const waiting = pending && !active;
  return (
    <>
      <Icon
        className={`h-5 w-5 shrink-0 ${waiting ? "animate-pulse text-gold-400" : ""}`}
        strokeWidth={active ? 2.4 : 1.75}
        aria-hidden
      />
      <span className="max-w-full break-words">{label}</span>
      {waiting ? <span className="sr-only">Loading</span> : null}
      <NavPulse active={active} waiting={waiting} />
    </>
  );
}

function NavPulse({ active, waiting }: { active: boolean; waiting: boolean }) {
  if (active) return <span className="h-0.5 w-4 sm:w-6 rounded-full bg-gold-400" />;
  if (!waiting) return null;
  return (
    <span
      className="h-1 w-5 sm:w-6 rounded-full bg-gold-400 animate-pulse"
      data-nav-pending=""
    />
  );
}

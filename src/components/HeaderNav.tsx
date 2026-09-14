"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  canChangePick: boolean;
  /** Show muted Change pick for commissioner when they cannot pick */
  showMutedChangePick?: boolean;
  /** Next week is open for this player — offer Make pick instead of silence. */
  showMakePick?: boolean;
};

export function HeaderNav({
  canChangePick,
  showMutedChangePick,
  showMakePick,
}: Props) {
  const path = usePathname();

  type Item = {
    key: string;
    href?: string;
    label: string;
    active: boolean;
    muted?: boolean;
    disabled?: boolean;
  };

  const items: Item[] = [
    {
      key: "pool",
      href: "/pool",
      label: "Pool",
      active: path === "/pool" || path.startsWith("/pool/"),
    },
  ];

  if (canChangePick) {
    items.push({
      key: "change",
      href: "/pick",
      label: "Change pick",
      active: path === "/pick" || path.startsWith("/pick/"),
    });
  } else if (showMakePick) {
    items.push({
      key: "make",
      href: "/pick",
      label: "Make pick",
      active: path === "/pick" || path.startsWith("/pick/"),
    });
  } else if (showMutedChangePick) {
    items.push({
      key: "change-muted",
      href: "/pick",
      label: "Change pick",
      active: false,
      muted: true,
    });
  }

  items.push(
    {
      key: "league",
      href: "/nfl",
      label: "League",
      active:
        path === "/nfl" ||
        path.startsWith("/nfl/") ||
        path.startsWith("/team/"),
    },
    {
      key: "schedule",
      href: "/schedule",
      label: "Schedule",
      active: path === "/schedule" || path.startsWith("/schedule/"),
    }
  );

  return (
    <nav
      aria-label="Secondary"
      data-share-chrome=""
      className="mx-auto max-w-pool w-full px-3 sm:px-4 pb-2.5 -mt-0.5"
    >
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((opts) => {
          const className = [
            "shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] sm:text-xs font-medium border transition-colors",
            opts.active
              ? "border-gold-400 text-gold-400 bg-gold-400/10"
              : opts.muted || opts.disabled
                ? "border-stadium-border text-[var(--text-muted)] opacity-50"
                : "border-stadium-border text-[var(--text-muted)] hover:border-gold-400/60 hover:text-gold-400",
          ].join(" ");

          if (!opts.href || opts.disabled) {
            return (
              <span
                key={opts.key}
                className={className}
                aria-disabled="true"
                title="Picks locked or unavailable"
              >
                {opts.label}
              </span>
            );
          }
          return (
            <Link
              key={opts.key}
              href={opts.href}
              prefetch={false}
              className={className}
            >
              {opts.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { teamHref } from "./team-paths";
import type { TeamPageData, TeamSection } from "./types";

function Row({
  href,
  label,
  count,
}: {
  href: string;
  label: string;
  count?: number;
}) {
  return (
    <li>
      <Link
        href={href}
        prefetch={false}
        className="flex items-center gap-2 min-h-11 py-2.5 px-0.5 rounded-md hover:bg-gold-400/5 active:bg-gold-400/10"
      >
        <span className="flex-1 font-medium">{label}</span>
        {count != null && (
          <span className="chip chip-gold text-xs">{count}</span>
        )}
        <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" aria-hidden />
      </Link>
    </li>
  );
}

export function TeamLookCloser({ data }: { data: TeamPageData }) {
  const items: Array<{ section: TeamSection; label: string; count?: number }> = [
    { section: "offence", label: "Offence", count: data.offence.length },
    { section: "defence", label: "Defence", count: data.defence.length },
    { section: "special-teams", label: "Special teams", count: data.special.length },
    {
      section: "injuries",
      label: "Injuries",
      count: data.injuries.failed ? undefined : data.injuries.injuries.length,
    },
    {
      section: "news",
      label: "News",
      count: data.news.failed ? undefined : data.news.items.length,
    },
  ];
  return (
    <section className="card-glass p-4 space-y-1">
      <h2 className="text-xl font-semibold text-gold-400">Look closer</h2>
      <p className="text-sm text-[var(--text-muted)] pb-1">
        Units, who&apos;s dinged, and the latest headlines.
      </p>
      <ul className="divide-y divide-stadium-border">
        {items.map((item) => (
          <Row
            key={item.section}
            href={teamHref(data.abbr, item.section)}
            label={item.label}
            count={item.count}
          />
        ))}
      </ul>
    </section>
  );
}

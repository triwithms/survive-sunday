import type { TeamNewsItem } from "@/lib/team-research";
import { formatNewsDate } from "./team-format";

export function TeamNewsList({ items }: { items: TeamNewsItem[] }) {
  return (
    <ul className="space-y-3 text-base">
      {items.map((n, i) => {
        const when = formatNewsDate(n.published);
        return (
          <li
            key={`${n.url}-${i}`}
            className="rounded-lg bg-[var(--stadium-700)]/40 p-3"
          >
            <a
              href={n.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[var(--text-primary)] underline decoration-gold-400/40 underline-offset-2 hover:decoration-gold-400"
            >
              {n.headline}
            </a>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs uppercase tracking-wide text-[var(--text-muted)]">
              <span className="chip chip-one-loss text-xs normal-case tracking-normal">
                {n.source}
              </span>
              {when && (
                <span className="normal-case tracking-normal">{when}</span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
